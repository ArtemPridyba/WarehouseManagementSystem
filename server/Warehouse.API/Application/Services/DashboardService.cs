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

    public async Task<DashboardStatsResponse> GetGeneralStatsAsync(Guid tenantId)
    {
        var now = DateTime.UtcNow;

        var summary = new SummaryStats(
            TotalProducts: await _context.Products.CountAsync(p => p.TenantId == tenantId),
            TotalItemsCount: await _context.InventoryBalances.Where(b => b.TenantId == tenantId).SumAsync(b => b.Quantity),
            PendingInboundOrders: await _context.InboundOrders.CountAsync(o => o.TenantId == tenantId && o.Status != OrderStatus.Completed),
            PendingOutboundOrders: await _context.OutboundOrders.CountAsync(o => o.TenantId == tenantId && o.Status != OrderStatus.Completed),
            LowStockAlerts: await _context.InventoryBalances.Where(b => b.TenantId == tenantId && b.Quantity < 10).CountAsync()
        );

        var categoryData = await _context.InventoryBalances
            .Where(b => b.TenantId == tenantId)
            .GroupBy(b => b.Product.Category.Name ?? "Без категорії")
            .Select(g => new CategoryDistributionDto(g.Key, g.Sum(x => x.Quantity), 0))
            .ToListAsync();

        var occupancy = await _context.Warehouses
            .Where(w => w.TenantId == tenantId)
            .Select(w => new WarehouseOccupancyDto(
                w.Name,
                w.Zones.SelectMany(z => z.Locations).Count(),
                w.Zones.SelectMany(z => z.Locations).Count(l => _context.InventoryBalances.Any(b => b.LocationId == l.Id)),
                0
            )).ToListAsync();

        var alerts = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.TenantId == tenantId && b.ExpirationDate != null && b.ExpirationDate <= now.AddDays(30))
            .Select(b => new ExpiryAlertDto(b.Product.Name, b.BatchNumber, b.ExpirationDate!.Value, (b.ExpirationDate.Value - now).Days))
            .Take(5)
            .ToListAsync();

        return new DashboardStatsResponse
        {
            Summary = summary,
            CategoryDistribution = categoryData,
            WarehouseOccupancy = occupancy.Select(o => o with { OccupancyPercentage = o.TotalLocations > 0 ? (double)o.OccupiedLocations / o.TotalLocations * 100 : 0 }).ToList(),
            ExpiryAlerts = alerts
        };
    }

    public async Task<IEnumerable<AbcAnalysisDto>> GetAbcAnalysisAsync(Guid tenantId)
    {
        var data = await _context.InventoryBalances
            .Where(b => b.TenantId == tenantId)
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

    public async Task<IEnumerable<LocationUtilizationDto>> GetLocationUtilizationAsync(Guid tenantId)
    {
        return await _context.Locations
            .Where(l => l.TenantId == tenantId)
            .GroupBy(l => l.Type)
            .Select(g => new LocationUtilizationDto(
                g.Key.ToString(),
                g.Count(),
                g.Count(l => _context.InventoryBalances.Any(b => b.LocationId == l.Id)),
                g.Count(l => !_context.InventoryBalances.Any(b => b.LocationId == l.Id))
            )).ToListAsync();
    }

    public async Task<IEnumerable<HourlyActivityDto>> GetHourlyHeatmapAsync(Guid tenantId)
    {
        var startDate = DateTime.UtcNow.AddDays(-7);
        
        var hoursData = await _context.InventoryTransactions
            .Where(t => t.TenantId == tenantId && t.CreatedAt >= startDate)
            .Select(t => t.CreatedAt.Hour)
            .ToListAsync();
        
        return hoursData
            .GroupBy(hour => hour)
            .Select(g => new HourlyActivityDto(
                g.Key, 
                g.Count()
            ))
            .OrderBy(g => g.Hour)
            .ToList();
    }

    public async Task<IEnumerable<StockTurnoverDto>> GetStockTurnoverAsync(Guid tenantId, int days)
    {
        var dateLimit = DateTime.UtcNow.AddDays(-days);
        return await _context.Products
            .Where(p => p.TenantId == tenantId)
            .Select(p => new StockTurnoverDto(
                p.Name,
                _context.InventoryTransactions.Where(t => t.ProductId == p.Id && t.Type == TransactionType.Inbound && t.CreatedAt >= dateLimit).Sum(t => t.Quantity),
                _context.InventoryTransactions.Where(t => t.ProductId == p.Id && t.Type == TransactionType.Outbound && t.CreatedAt >= dateLimit).Sum(t => t.Quantity),
                0
            )).ToListAsync();
    }
}