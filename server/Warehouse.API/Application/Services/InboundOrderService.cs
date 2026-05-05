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

    public async Task<IEnumerable<InboundOrder>> GetAllAsync()
    {
        return await _context.InboundOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<InboundOrder?> GetByIdAsync(Guid id)
    {
        return await _context.InboundOrders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<InboundOrder> CreateAsync(InboundOrderRequest request)
    {
        var exists = await _context.InboundOrders
            .AnyAsync(o => o.OrderNumber == request.OrderNumber);
        
        if (exists) throw new Exception($"Замовлення з номером {request.OrderNumber} вже існує");

        var order = new InboundOrder
        {
            OrderNumber = request.OrderNumber,
            Status = OrderStatus.Draft,
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

    public async Task<bool> DeleteAsync(Guid id)
    {
        var order = await _context.InboundOrders.FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return false;

        if (order.Status == OrderStatus.Completed)
            throw new Exception("Неможливо видалити вже виконане замовлення");

        _context.InboundOrders.Remove(order);
        await _context.SaveChangesAsync();
        return true;
    }
}