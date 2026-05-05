using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Dashboard;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsResponse> GetGeneralStatsAsync()
    {
        var now = DateTime.UtcNow;

        var summary = new SummaryStats(
            TotalProducts: await _context.Products.CountAsync(),
            TotalItemsCount: await _context.InventoryBalances.SumAsync(b => b.Quantity),
            PendingInboundOrders: await _context.InboundOrders.CountAsync(o => o.Status != OrderStatus.Completed),
            PendingOutboundOrders: await _context.OutboundOrders.CountAsync(o => o.Status != OrderStatus.Completed),
            LowStockAlerts: await _context.InventoryBalances.Where(b => b.Quantity < 10).CountAsync()
        );

        var categoryData = await _context.InventoryBalances
            .GroupBy(b => b.Product.Category.Name ?? "Без категорії")
            .Select(g => new CategoryDistributionDto(g.Key, g.Sum(x => x.Quantity), 0))
            .ToListAsync();

        var occupancy = await _context.Warehouses
            .Select(w => new WarehouseOccupancyDto(
                w.Name,
                w.Zones.SelectMany(z => z.Locations).Count(),
                w.Zones.SelectMany(z => z.Locations).Count(l => _context.InventoryBalances.Any(b => b.LocationId == l.Id)),
                0
            )).ToListAsync();

        var alerts = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.ExpirationDate != null && b.ExpirationDate <= now.AddDays(30))
            .Select(b => new ExpiryAlertDto(b.Product.Name, b.BatchNumber, b.ExpirationDate!.Value, (b.ExpirationDate.Value - now).Days))
            .Take(5)
            .ToListAsync();

        return new DashboardStatsResponse
        {
            Summary = summary,
            CategoryDistribution = categoryData,
            WarehouseOccupancy = occupancy.Select(o => o with { 
                OccupancyPercentage = o.TotalLocations > 0 ? (double)o.OccupiedLocations / o.TotalLocations * 100 : 0 
            }).ToList(),
            ExpiryAlerts = alerts
        };
    }

    public async Task<IEnumerable<AbcAnalysisDto>> GetAbcAnalysisAsync()
    {
        var data = await _context.InventoryBalances
            .GroupBy(b => b.Product.Category.Name ?? "Інше")
            .Select(g => new { Name = g.Key, Qty = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.Qty)
            .ToListAsync();

        decimal total = data.Sum(x => x.Qty);
        decimal cumulative = 0;

        return data.Select(x => {
            cumulative += x.Qty;
            var percentage = total > 0 ? (cumulative / total) * 100 : 0;
            return new AbcAnalysisDto(x.Name, x.Qty, percentage <= 80 ? "A" : percentage <= 95 ? "B" : "C");
        });
    }

    public async Task<IEnumerable<LocationUtilizationDto>> GetLocationUtilizationAsync()
    {
        return await _context.Locations
            .GroupBy(l => l.Type)
            .Select(g => new LocationUtilizationDto(
                g.Key.ToString(),
                g.Count(),
                g.Count(l => _context.InventoryBalances.Any(b => b.LocationId == l.Id)),
                g.Count(l => !_context.InventoryBalances.Any(b => b.LocationId == l.Id))
            )).ToListAsync();
    }

    public async Task<IEnumerable<HourlyActivityDto>> GetHourlyHeatmapAsync()
    {
        var startDate = DateTime.UtcNow.AddDays(-7);
        
        var hoursData = await _context.InventoryTransactions
            .Where(t => t.CreatedAt >= startDate)
            .Select(t => t.CreatedAt.Hour)
            .ToListAsync();
        
        return hoursData
            .GroupBy(hour => hour)
            .Select(g => new HourlyActivityDto(g.Key, g.Count()))
            .OrderBy(g => g.Hour)
            .ToList();
    }

    public async Task<IEnumerable<StockTurnoverDto>> GetStockTurnoverAsync(int days)
    {
        var dateLimit = DateTime.UtcNow.AddDays(-days);
        
        var products = await _context.Products.AsNoTracking().ToListAsync();
        var result = new List<StockTurnoverDto>();

        foreach (var p in products)
        {
            var inbound = await _context.InventoryTransactions
                .Where(t => t.ProductId == p.Id && t.Type == TransactionType.Inbound && t.CreatedAt >= dateLimit)
                .SumAsync(t => t.Quantity);

            var outbound = await _context.InventoryTransactions
                .Where(t => t.ProductId == p.Id && t.Type == TransactionType.Outbound && t.CreatedAt >= dateLimit)
                .SumAsync(t => t.Quantity);

            result.Add(new StockTurnoverDto(p.Name, inbound, outbound, inbound > 0 ? (double)(outbound / inbound) : 0));
        }

        return result;
    }
}