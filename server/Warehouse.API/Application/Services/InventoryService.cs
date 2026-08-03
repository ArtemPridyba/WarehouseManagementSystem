using Microsoft.AspNetCore.Identity;
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
    private readonly ICurrentUserContext _currentUser;
    private readonly UserManager<AppUser> _userManager;

    public InventoryService(
        ApplicationDbContext context,
        ICurrentUserContext currentUser,
        UserManager<AppUser> userManager)
    {
        _context = context;
        _currentUser = currentUser;
        _userManager = userManager;
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
            .ThenInclude(l => l.Zone)
            .ThenInclude(z => z.Warehouse)
            .Include(b => b.Batch)
            .Where(b => b.ProductId == productId && b.Quantity > 0)
            .Select(b => new {
                LocationCode      = b.Location.Code,
                LocationId        = b.LocationId,
                ZoneName          = b.Location.Zone.Name,
                WarehouseName     = b.Location.Zone.Warehouse.Name,
                AvailableQuantity = b.Quantity,
                BatchNumber       = b.Batch != null ? b.Batch.BatchNumber : "No Batch",
                ExpiryDate        = b.Batch != null ? b.Batch.ExpirationDate : (DateTime?)null
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
                Reference = "Internal Transfer",
                CreatedByUserId = _currentUser.UserId
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

    // Worker бачить тільки свої транзакції
    var roles = await GetCurrentUserRolesAsync();
    if (roles.Contains("Worker"))
    {
        var userId = _currentUser.UserId;
        q = q.Where(t => t.CreatedByUserId == userId);
    }

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

private async Task<IList<string>> GetCurrentUserRolesAsync()
{
    if (_currentUser.UserId == null) return new List<string>();
    var user = await _context.Users.FindAsync(_currentUser.UserId);
    if (user == null) return new List<string>();
    return await _userManager.GetRolesAsync(user);
}

public async Task<StockCountResultDto> ProcessStockCountAsync(StockCountRequest request)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // Поточний залишок в системі
        var balance = await _context.InventoryBalances
            .Include(b => b.Product)
            .Include(b => b.Location)
            .FirstOrDefaultAsync(b =>
                b.LocationId == request.LocationId &&
                b.ProductId  == request.ProductId  &&
                b.BatchId    == request.BatchId);

        var systemQuantity = balance?.Quantity ?? 0;
        var delta          = request.ActualQuantity - systemQuantity;

        var productName  = balance?.Product?.Name
            ?? (await _context.Products.FindAsync(request.ProductId))?.Name
            ?? "";
        var locationCode = balance?.Location?.Code
            ?? (await _context.Locations.FindAsync(request.LocationId))?.Code
            ?? "";

        // Якщо є розбіжність — коригуємо
        if (delta != 0)
        {
            if (balance == null && request.ActualQuantity > 0)
            {
                // Товару не було — створюємо баланс
                balance = new InventoryBalance
                {
                    ProductId  = request.ProductId,
                    LocationId = request.LocationId,
                    BatchId    = request.BatchId,
                    Quantity   = request.ActualQuantity,
                };
                _context.InventoryBalances.Add(balance);
            }
            else if (balance != null)
            {
                balance.Quantity = request.ActualQuantity;
                if (balance.Quantity <= 0)
                    _context.InventoryBalances.Remove(balance);
            }

            // Транзакція коригування
            var note = string.IsNullOrEmpty(request.Note)
                ? $"Stock Count: розбіжність {(delta > 0 ? "+" : "")}{delta}"
                : $"Stock Count: {request.Note}";

            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                ProductId       = request.ProductId,
                FromLocationId  = request.LocationId,
                ToLocationId    = request.LocationId,
                BatchId         = request.BatchId,
                Quantity        = delta,
                Type            = TransactionType.Adjustment,
                Reference       = note,
                CreatedAt       = DateTime.UtcNow,
                CreatedByUserId = _currentUser.UserId,
            });

            await _context.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        return new StockCountResultDto
        {
            ProductId       = request.ProductId,
            ProductName     = productName,
            LocationCode    = locationCode,
            SystemQuantity  = systemQuantity,
            ActualQuantity  = request.ActualQuantity,
            Discrepancy     = delta,
            HasDiscrepancy  = delta != 0,
        };
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
}