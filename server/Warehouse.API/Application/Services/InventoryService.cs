using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Common;
using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<IEnumerable<InventoryBalance>> GetWarehouseStockAsync(Guid warehouseId)
    {
        return await _context.InventoryBalances
            .Include(b => b.Product)
            .Include(b => b.Location)
                .ThenInclude(l => l.Zone)
            .Include(b => b.Batch)
            .Where(b => b.Location.Zone.WarehouseId == warehouseId)
            .AsNoTracking()
            .ToListAsync();
    }
    
    public async Task<IEnumerable<object>> GetAvailableLocationsForProductAsync(Guid productId)
    {
        return await _context.InventoryBalances
            .Include(b => b.Location)
            .Include(b => b.Batch)
            .Where(b => b.ProductId == productId && b.Quantity > 0)
            .Select(b => new {
                LocationCode = b.Location.Code,
                LocationId = b.LocationId,
                AvailableQuantity = b.Quantity,
                BatchNumber = b.Batch != null ? b.Batch.BatchNumber : "No Batch",
                ExpiryDate = b.Batch != null ? b.Batch.ExpirationDate : null
            })
            .AsNoTracking()
            .ToListAsync();
    }
    
    public async Task<bool> InternalTransferAsync(TransferRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var sourceBalance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.LocationId == request.FromLocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            if (sourceBalance == null || sourceBalance.Quantity < request.Quantity)
            {
                throw new Exception("Недостатньо товару на вихідній локації");
            }
            
            sourceBalance.Quantity -= request.Quantity;
            if (sourceBalance.Quantity == 0)
            {
                _context.InventoryBalances.Remove(sourceBalance);
            }
            
            var destBalance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.LocationId == request.ToLocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            if (destBalance == null)
            {
                destBalance = new InventoryBalance
                {
                    ProductId = request.ProductId,
                    LocationId = request.ToLocationId,
                    BatchId = request.BatchId,
                    Quantity = request.Quantity
                };
                _context.InventoryBalances.Add(destBalance);
            }
            else
            {
                destBalance.Quantity += request.Quantity;
            }
            
            var movement = new InventoryTransaction
            {
                ProductId = request.ProductId,
                FromLocationId = request.FromLocationId,
                ToLocationId = request.ToLocationId,
                BatchId = request.BatchId,
                Quantity = request.Quantity,
                Type = TransactionType.Transfer,
                CreatedAt = DateTime.UtcNow,
                Reference = "Internal Transfer"
            };
            _context.InventoryTransactions.Add(movement);
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    public async Task<bool> AdjustStockAsync(AdjustmentRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var balance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.LocationId == request.LocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            decimal oldQuantity = balance?.Quantity ?? 0;
            decimal delta = request.NewQuantity - oldQuantity;

            if (delta == 0) return true; 

            if (balance == null)
            {
                balance = new InventoryBalance
                {
                    ProductId = request.ProductId,
                    LocationId = request.LocationId,
                    BatchId = request.BatchId,
                    Quantity = request.NewQuantity
                };
                _context.InventoryBalances.Add(balance);
            }
            else
            {
                balance.Quantity = request.NewQuantity;
                if (balance.Quantity <= 0) _context.InventoryBalances.Remove(balance);
            }
            
            var movement = new InventoryTransaction
            {
                ProductId = request.ProductId,
                FromLocationId = request.LocationId, 
                ToLocationId = request.LocationId,
                BatchId = request.BatchId,
                Quantity = delta,
                Type = TransactionType.Adjustment,
                CreatedAt = DateTime.UtcNow,
                Reference = $"Adjustment: {request.Reason}"
            };
            _context.InventoryTransactions.Add(movement);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    public async Task<PagedResult<InventoryTransactionDto>> GetTransactionsAsync(GetTransactionsQuery query)
    {
        var q = _context.InventoryTransactions
            .Include(t => t.Product)
            .Include(t => t.FromLocation).ThenInclude(l => l!.Zone)
            .Include(t => t.ToLocation).ThenInclude(l => l!.Zone)
            .Include(t => t.Batch)
            .AsNoTracking()
            .AsQueryable();

        if (query.Type.HasValue)
            q = q.Where(t => t.Type == query.Type.Value);

        if (query.From.HasValue)
            q = q.Where(t => t.CreatedAt >= query.From.Value);

        if (query.To.HasValue)
            q = q.Where(t => t.CreatedAt <= query.To.Value.AddDays(1));

        if (query.WarehouseId.HasValue)
            q = q.Where(t =>
                (t.FromLocation != null && t.FromLocation.Zone.WarehouseId == query.WarehouseId.Value) ||
                (t.ToLocation   != null && t.ToLocation.Zone.WarehouseId   == query.WarehouseId.Value));

        var projected = q
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new InventoryTransactionDto
            {
                Id           = t.Id,
                ProductName  = t.Product.Name,
                SKU          = t.Product.SKU,
                Type         = t.Type.ToString(),
                Quantity     = t.Quantity,
                FromLocation = t.FromLocation != null ? t.FromLocation.Code : null,
                FromZone     = t.FromLocation != null ? t.FromLocation.Zone.Name : null,
                ToLocation   = t.ToLocation   != null ? t.ToLocation.Code   : null,
                ToZone       = t.ToLocation   != null ? t.ToLocation.Zone.Name   : null,
                BatchNumber  = t.Batch        != null ? t.Batch.BatchNumber  : null,
                Reference    = t.Reference,
                CreatedAt    = t.CreatedAt,
            });

        return await projected.ToPagedResultAsync(query);
    }
}