using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class OutboundOrderService : IOutboundOrderService
{
    private readonly ApplicationDbContext _context;

    public OutboundOrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<OutboundOrder>> GetAllAsync(Guid tenantId)
    {
        return await _context.OutboundOrders
            .Include(o => o.Items)
            .Where(o => o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<OutboundOrder?> GetByIdAsync(Guid tenantId, Guid id)
    {
        return await _context.OutboundOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);
    }

    public async Task<OutboundOrder> CreateAsync(Guid tenantId, OutboundOrderRequest request)
    {
        // Перевірка на унікальність номера замовлення
        var exists = await _context.OutboundOrders
            .AnyAsync(o => o.TenantId == tenantId && o.OrderNumber == request.OrderNumber);
        
        if (exists) throw new Exception($"Вихідне замовлення {request.OrderNumber} вже існує");

        var order = new OutboundOrder
        {
            TenantId = tenantId,
            OrderNumber = request.OrderNumber,
            CustomerName = request.CustomerName,
            Status = OrderStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            Items = request.Items.Select(i => new OutboundOrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                ShippedQuantity = 0
            }).ToList()
        };

        _context.OutboundOrders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<bool> DeleteAsync(Guid tenantId, Guid id)
    {
        var order = await _context.OutboundOrders
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);

        if (order == null) return false;

        if (order.Status == OrderStatus.Completed)
            throw new Exception("Неможливо видалити відвантажене замовлення");

        _context.OutboundOrders.Remove(order);
        await _context.SaveChangesAsync();
        return true;
    }
}