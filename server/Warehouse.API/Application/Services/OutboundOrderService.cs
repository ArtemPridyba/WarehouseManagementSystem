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

    public async Task<IEnumerable<OutboundOrder>> GetAllAsync()
    {
        return await _context.OutboundOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product) 
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<OutboundOrder?> GetByIdAsync(Guid id)
    {
        return await _context.OutboundOrders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<OutboundOrder> CreateAsync(OutboundOrderRequest request)
    {
        var exists = await _context.OutboundOrders
            .AnyAsync(o => o.OrderNumber == request.OrderNumber);
        
        if (exists) throw new Exception($"Вихідне замовлення {request.OrderNumber} вже існує");

        var order = new OutboundOrder
        {
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

    public async Task<bool> DeleteAsync(Guid id)
    {
        var order = await _context.OutboundOrders.FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return false;

        if (order.Status == OrderStatus.Completed)
            throw new Exception("Неможливо видалити відвантажене замовлення");

        _context.OutboundOrders.Remove(order);
        await _context.SaveChangesAsync();
        return true;
    }
}