using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.WorkOrders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class WorkOrderService : IWorkOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public WorkOrderService(ApplicationDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private IQueryable<WorkOrder> BaseQuery() =>
        _context.WorkOrders
            .Include(w => w.AssignedTo)
            .Include(w => w.CreatedBy)
            .Include(w => w.Product)
            .Include(w => w.FromLocation)
            .Include(w => w.ToLocation)
            .Include(w => w.InboundOrder)
            .Include(w => w.OutboundOrder)
            .AsNoTracking();

    private static WorkOrderDto ToDto(WorkOrder w) => new()
    {
        Id = w.Id,
        Type = w.Type,
        Status = w.Status,
        Priority = w.Priority,
        Title = w.Title,
        Description = w.Description,
        AssignedToId = w.AssignedToId,
        AssignedToName = w.AssignedTo != null ? $"{w.AssignedTo.FirstName} {w.AssignedTo.LastName}" : null,
        CreatedById = w.CreatedById,
        CreatedByName = w.CreatedBy != null ? $"{w.CreatedBy.FirstName} {w.CreatedBy.LastName}" : null,
        InboundOrderId = w.InboundOrderId,
        InboundOrderNumber = w.InboundOrder?.OrderNumber,
        OutboundOrderId = w.OutboundOrderId,
        OutboundOrderNumber = w.OutboundOrder?.OrderNumber,
        ProductId = w.ProductId,
        ProductName = w.Product?.Name,
        FromLocationId = w.FromLocationId,
        FromLocationCode = w.FromLocation?.Code,
        ToLocationId = w.ToLocationId,
        ToLocationCode = w.ToLocation?.Code,
        Quantity = w.Quantity,
        DueDate = w.DueDate,
        CompletedAt = w.CompletedAt,
        CompletionNote = w.CompletionNote,
        CreatedAt = w.CreatedAt,
    };

    public async Task<IEnumerable<WorkOrderDto>> GetAllAsync(WorkOrderStatus? status = null)
    {
        var query = BaseQuery();
        if (status.HasValue)
            query = query.Where(w => w.Status == status.Value);
        return (await query.OrderByDescending(w => w.CreatedAt).ToListAsync()).Select(ToDto);
    }

    public async Task<IEnumerable<WorkOrderDto>> GetMyTasksAsync()
    {
        var userId = _currentUser.UserId;
        return (await BaseQuery()
            .Where(w => w.AssignedToId == userId && w.Status != WorkOrderStatus.Completed && w.Status != WorkOrderStatus.Cancelled)
            .OrderBy(w => w.Priority)
            .OrderBy(w => w.DueDate)
            .ToListAsync()).Select(ToDto);
    }

    public async Task<WorkOrderDto?> GetByIdAsync(Guid id)
    {
        var w = await BaseQuery().FirstOrDefaultAsync(w => w.Id == id);
        return w == null ? null : ToDto(w);
    }

    public async Task<WorkOrderDto> CreateAsync(CreateWorkOrderRequest request)
    {
        var workOrder = new WorkOrder
        {
            Type = request.Type,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            AssignedToId = request.AssignedToId,
            CreatedById = _currentUser.UserId!.Value,
            InboundOrderId = request.InboundOrderId,
            OutboundOrderId = request.OutboundOrderId,
            ProductId = request.ProductId,
            FromLocationId = request.FromLocationId,
            ToLocationId = request.ToLocationId,
            Quantity = request.Quantity,
            DueDate = request.DueDate.HasValue
                ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc)
                : null,
            CreatedAt = DateTime.UtcNow,
        };

        _context.WorkOrders.Add(workOrder);
        await _context.SaveChangesAsync();

        return ToDto(await BaseQuery().FirstAsync(w => w.Id == workOrder.Id));
    }

    public async Task<WorkOrderDto> UpdateStatusAsync(Guid id, UpdateWorkOrderStatusRequest request)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id)
            ?? throw new Exception("Завдання не знайдено");

        workOrder.Status = request.Status;
        workOrder.CompletionNote = request.CompletionNote;

        if (request.Status == WorkOrderStatus.Completed)
            workOrder.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ToDto(await BaseQuery().FirstAsync(w => w.Id == id));
    }

    public async Task<WorkOrderDto> AssignAsync(Guid id, AssignWorkOrderRequest request)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id)
            ?? throw new Exception("Завдання не знайдено");

        workOrder.AssignedToId = request.AssignedToId;
        await _context.SaveChangesAsync();
        return ToDto(await BaseQuery().FirstAsync(w => w.Id == id));
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id);
        if (workOrder == null) return false;
        if (workOrder.Status == WorkOrderStatus.Completed)
            throw new Exception("Не можна видалити виконане завдання");

        _context.WorkOrders.Remove(workOrder);
        await _context.SaveChangesAsync();
        return true;
    }
}