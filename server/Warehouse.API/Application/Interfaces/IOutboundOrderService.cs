using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IOutboundOrderService
{
    Task<IEnumerable<OutboundOrder>> GetAllAsync(Guid tenantId);
    Task<OutboundOrder?> GetByIdAsync(Guid tenantId, Guid id);
    Task<OutboundOrder> CreateAsync(Guid tenantId, OutboundOrderRequest request);
    Task<bool> DeleteAsync(Guid tenantId, Guid id);
}