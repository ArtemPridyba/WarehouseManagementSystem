using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IInboundOrderService
{
    Task<IEnumerable<InboundOrder>> GetAllAsync();
    Task<InboundOrder?> GetByIdAsync(Guid id);
    Task<InboundOrder> CreateAsync(InboundOrderRequest request);
    Task<bool> DeleteAsync(Guid id);
}