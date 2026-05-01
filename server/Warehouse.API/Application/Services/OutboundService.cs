using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Outbound;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class OutboundService : IOutboundService
{
    private readonly ApplicationDbContext _context;

    public OutboundService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ShipProductAsync(Guid tenantId, ShipProductRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var orderItem = await _context.OutboundOrderItems
                .Include(oi => oi.OutboundOrder)
                .FirstOrDefaultAsync(oi => oi.OutboundOrderId == request.OutboundOrderId && 
                                          oi.ProductId == request.ProductId);

            if (orderItem == null) 
                throw new Exception("Товар не знайдено в замовленні на відвантаження!");

            if (orderItem.ShippedQuantity + request.Quantity > orderItem.Quantity)
                throw new Exception($"Перевідвантаження заборонено! Очікувана решта: {orderItem.Quantity - orderItem.ShippedQuantity}");
            
            var balance = await _context.InventoryBalances
                .FirstOrDefaultAsync(b => b.TenantId == tenantId &&
                                         b.LocationId == request.LocationId &&
                                         b.ProductId == request.ProductId &&
                                         b.BatchId == request.BatchId);

            if (balance == null || balance.Quantity < request.Quantity)
                throw new Exception($"Недостатньо товару на локації! Доступно: {(balance?.Quantity ?? 0)}");
            
            balance.Quantity -= request.Quantity;
            if (balance.Quantity == 0) _context.InventoryBalances.Remove(balance);
            
            orderItem.ShippedQuantity += request.Quantity;
            
            var movement = new InventoryTransaction
            {
                TenantId = tenantId,
                ProductId = request.ProductId,
                FromLocationId = request.LocationId,
                ToLocationId = null,
                BatchId = request.BatchId,
                Quantity = request.Quantity,
                Type = TransactionType.Outbound,
                CreatedAt = DateTime.UtcNow,
                Reference = $"Shipment: {orderItem.OutboundOrder.OrderNumber}"
            };
            _context.InventoryTransactions.Add(movement);
            
            var allItemsInOrder = await _context.OutboundOrderItems
                .Where(oi => oi.OutboundOrderId == request.OutboundOrderId)
                .ToListAsync();

            var allShipped = allItemsInOrder.All(oi => oi.ShippedQuantity == oi.Quantity);

            if (allShipped)
            {
                orderItem.OutboundOrder.Status = OrderStatus.Completed;
            }
            else
            {
                orderItem.OutboundOrder.Status = OrderStatus.InProgress;
            }

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