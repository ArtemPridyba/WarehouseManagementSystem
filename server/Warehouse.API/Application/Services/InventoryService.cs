using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> InternalTransferAsync(Guid tenantId, TransferRequest request)
    {
        // 1. Починаємо транзакцію (ACID принцип)
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 2. Шукаємо звідки забирати (Source)
            var sourceBalance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.TenantId == tenantId &&
                                         b.LocationId == request.FromLocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            if (sourceBalance == null || sourceBalance.Quantity < request.Quantity)
            {
                // Тут у реальному проекті краще викидати кастомне Exception
                return false; 
            }

            // 3. Віднімаємо кількість
            sourceBalance.Quantity -= request.Quantity;
            
            // Якщо на полиці стало 0 - видаляємо рядок залишку, щоб не засмічувати базу
            if (sourceBalance.Quantity == 0)
            {
                _context.InventoryBalances.Remove(sourceBalance);
            }

            // 4. Шукаємо куди класти (Destination)
            var destBalance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.TenantId == tenantId &&
                                         b.LocationId == request.ToLocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            if (destBalance == null)
            {
                // Якщо на цій полиці ще немає такого товару/партії - створюємо новий рядок
                destBalance = new InventoryBalance
                {
                    TenantId = tenantId,
                    ProductId = request.ProductId,
                    LocationId = request.ToLocationId,
                    BatchId = request.BatchId,
                    Quantity = request.Quantity
                };
                _context.InventoryBalances.Add(destBalance);
            }
            else
            {
                // Якщо товар вже там є - просто плюсуємо
                destBalance.Quantity += request.Quantity;
            }

            // 5. Зберігаємо всі зміни одним махом
            await _context.SaveChangesAsync();
            
            // 6. Фіксуємо транзакцію
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception)
        {
            // Якщо на будь-якому етапі (наприклад, збій БД) виникла помилка - відкочуємо все
            await transaction.RollbackAsync();
            return false;
        }
    }
    
    public async Task<IEnumerable<InventoryBalance>> GetWarehouseStockAsync(Guid tenantId, Guid warehouseId)
    {
        return await _context.InventoryBalances
            .Include(b => b.Product)     // Підтягуємо назву товару
            .Include(b => b.Location)    // Підтягуємо код комірки
            .Include(b => b.Batch)       // Підтягуємо дані партії
            .Where(b => b.TenantId == tenantId && b.Location.Zone.WarehouseId == warehouseId)
            .AsNoTracking()
            .ToListAsync();
    }
}