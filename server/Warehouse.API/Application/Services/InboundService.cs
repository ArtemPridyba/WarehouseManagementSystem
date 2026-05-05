using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Inbound;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class InboundService : IInboundService
{
    private readonly ApplicationDbContext _context;

    public InboundService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ReceiveProductAsync(ReceiveProductRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var orderItem = await _context.InboundOrderItems
                .Include(oi => oi.InboundOrder)
                .FirstOrDefaultAsync(oi => oi.InboundOrderId == request.InboundOrderId && 
                                          oi.ProductId == request.ProductId);

            if (orderItem == null) 
                throw new Exception("Товар не знайдено в плані закупівлі!");

            if (orderItem.ReceivedQuantity + request.Quantity > orderItem.Quantity)
            {
                throw new Exception($"Переприймання заборонено! Очікувана решта: {orderItem.Quantity - orderItem.ReceivedQuantity}");
            }

            Guid? batchId = null;
            if (!string.IsNullOrEmpty(request.BatchNumber))
            {
                var batch = await _context.Batches
                    .FirstOrDefaultAsync(b => b.BatchNumber == request.BatchNumber && 
                                             b.ProductId == request.ProductId);

                if (batch == null)
                {
                    batch = new Batch
                    {
                        ProductId = request.ProductId,
                        BatchNumber = request.BatchNumber,
                        ExpirationDate = request.ExpirationDate
                    };
                    _context.Batches.Add(batch);
                    await _context.SaveChangesAsync(); 
                }
                batchId = batch.Id;
            }

            var balance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.LocationId == request.LocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == batchId);

            if (balance == null)
            {
                balance = new InventoryBalance
                {
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

            orderItem.ReceivedQuantity += request.Quantity;

            var movement = new InventoryTransaction
            {
                ProductId = request.ProductId,
                FromLocationId = null,
                ToLocationId = request.LocationId,
                BatchId = batchId,
                Quantity = request.Quantity,
                Type = TransactionType.Inbound,
                CreatedAt = DateTime.UtcNow,
                Reference = $"Inbound Order: {orderItem.InboundOrder.OrderNumber}" 
            };
            _context.InventoryTransactions.Add(movement);

            var allItemsInOrder = await _context.InboundOrderItems
                .Where(oi => oi.InboundOrderId == request.InboundOrderId)
                .ToListAsync();

            var allReceived = allItemsInOrder.All(oi => oi.ReceivedQuantity == oi.Quantity);
            orderItem.InboundOrder.Status = allReceived ? OrderStatus.Completed : OrderStatus.InProgress;

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
}