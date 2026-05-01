using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class InboundOrderService : IInboundOrderService
{
    private readonly ApplicationDbContext _context;

    public InboundOrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<InboundOrder>> GetAllAsync(Guid tenantId)
    {
        return await _context.InboundOrders
            .Include(o => o.Items)
            .Where(o => o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<InboundOrder?> GetByIdAsync(Guid tenantId, Guid id)
    {
        return await _context.InboundOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);
    }

    public async Task<InboundOrder> CreateAsync(Guid tenantId, InboundOrderRequest request)
    {
        // Перевірка на унікальність номера замовлення
        var exists = await _context.InboundOrders
            .AnyAsync(o => o.TenantId == tenantId && o.OrderNumber == request.OrderNumber);
        
        if (exists) throw new Exception($"Замовлення з номером {request.OrderNumber} вже існує");

        var order = new InboundOrder
        {
            TenantId = tenantId,
            OrderNumber = request.OrderNumber,
            Status = OrderStatus.Draft, // Початковий статус
            CreatedAt = DateTime.UtcNow,
            Items = request.Items.Select(i => new InboundOrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                ReceivedQuantity = 0
            }).ToList()
        };

        _context.InboundOrders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<bool> DeleteAsync(Guid tenantId, Guid id)
    {
        var order = await _context.InboundOrders
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);

        if (order == null) return false;

        // Бізнес-правило: не можна видаляти вже виконані замовлення
        if (order.Status == OrderStatus.Completed)
            throw new Exception("Неможливо видалити завершене замовлення");

        _context.InboundOrders.Remove(order);
        await _context.SaveChangesAsync();
        return true;
    }
}