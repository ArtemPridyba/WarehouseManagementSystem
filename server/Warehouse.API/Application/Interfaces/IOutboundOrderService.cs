using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IOutboundOrderService
{
    Task<IEnumerable<OutboundOrder>> GetAllAsync();
    Task<OutboundOrder?> GetByIdAsync(Guid id);
    Task<OutboundOrder> CreateAsync(OutboundOrderRequest request);
    Task<bool> DeleteAsync(Guid id);
}