using Warehouse.API.Application.DTOs.WorkOrders;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.Interfaces;

public interface IWorkOrderService
{
    Task<IEnumerable<WorkOrderDto>> GetAllAsync(WorkOrderStatus? status = null);
    Task<IEnumerable<WorkOrderDto>> GetMyTasksAsync();
    Task<WorkOrderDto?> GetByIdAsync(Guid id);
    Task<WorkOrderDto> CreateAsync(CreateWorkOrderRequest request);
    Task<WorkOrderDto> UpdateStatusAsync(Guid id, UpdateWorkOrderStatusRequest request);
    Task<WorkOrderDto> AssignAsync(Guid id, AssignWorkOrderRequest request);
    Task<bool> DeleteAsync(Guid id);
}