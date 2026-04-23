using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Inbound;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums; // Додано для TransactionType
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class InboundService : IInboundService
{
    private readonly ApplicationDbContext _context;

    public InboundService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ReceiveProductAsync(Guid tenantId, ReceiveProductRequest request)
    {
        // Починаємо транзакцію: або все зберігається, або нічого
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Перевіряємо, чи існує такий рядок у замовленні на прихід
            var orderItem = await _context.InboundOrderItems
                .FirstOrDefaultAsync(oi => oi.InboundOrderId == request.InboundOrderId && 
                                          oi.ProductId == request.ProductId);

            if (orderItem == null) 
                throw new Exception("Товар не знайдено в плані закупівлі (Inbound Order)!");

            // 2. Обробка партії (Batch)
            Guid? batchId = null;
            if (!string.IsNullOrEmpty(request.BatchNumber))
            {
                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.TenantId == tenantId && 
                                             b.BatchNumber == request.BatchNumber && 
                                             b.ProductId == request.ProductId);

                if (batch == null)
                {
                    batch = new Batch
                    {
                        TenantId = tenantId,
                        ProductId = request.ProductId,
                        BatchNumber = request.BatchNumber,
                        ExpirationDate = request.ExpirationDate
                    };
                    _context.Batches.Add(batch);
                    // Зберігаємо, щоб отримати ID для подальших зв'язків
                    await _context.SaveChangesAsync();
                }
                batchId = batch.Id;
            }

            // 3. Оновлюємо/Створюємо залишок (Inventory Balance)
            var balance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.TenantId == tenantId &&
                                         b.LocationId == request.LocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == batchId);

            if (balance == null)
            {
                balance = new InventoryBalance
                {
                    TenantId = tenantId,
                    ProductId = request.ProductId,
                    LocationId = request.LocationId,
                    BatchId = batchId,
                    Quantity = request.Quantity
                };
                _context.InventoryBalances.Add(balance);
            }
            else
            {
                balance.Quantity += request.Quantity;
            }

            // 4. Створюємо запис про рух товару (Transaction History)
            // Це дозволить побудувати звіт "Історія складських операцій"
            var movement = new InventoryTransaction
            {
                TenantId = tenantId,
                ProductId = request.ProductId,
                FromLocationId = null, // Прихід — товар прийшов ззовні системи
                ToLocationId = request.LocationId,
                BatchId = batchId,
                Quantity = request.Quantity,
                Type = TransactionType.Inbound,
                CreatedAt = DateTime.UtcNow,
                Reference = $"Order: {request.InboundOrderId}" 
            };
            _context.InventoryTransactions.Add(movement);

            // 5. Фінальне збереження всіх змін
            await _context.SaveChangesAsync();
            
            // Підтверджуємо успішне завершення всіх кроків
            await transaction.CommitAsync();
            return true;
        }
        catch (Exception ex)
        {
            // Якщо сталася будь-яка помилка - скасовуємо всі зміни в БД
            await transaction.RollbackAsync();
            // Тут можна додати логування помилки (logger.LogError)
            return false;
        }
    }
}