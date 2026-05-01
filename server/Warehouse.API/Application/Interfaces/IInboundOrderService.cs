using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IInboundOrderService
{
    Task<IEnumerable<InboundOrder>> GetAllAsync(Guid tenantId);
    Task<InboundOrder?> GetByIdAsync(Guid tenantId, Guid id);
    Task<InboundOrder> CreateAsync(Guid tenantId, InboundOrderRequest request);
    Task<bool> DeleteAsync(Guid tenantId, Guid id);
}