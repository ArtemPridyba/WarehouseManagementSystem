using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Common;
using Warehouse.API.Application.DTOs.WorkOrders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class WorkOrderService(ApplicationDbContext context, ICurrentUserContext currentUser) : IWorkOrderService
{
    private readonly ApplicationDbContext _context = context;
    private readonly ICurrentUserContext _currentUser = currentUser;

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
        Id                  = w.Id,
        Type                = w.Type,
        Status              = w.Status,
        Priority            = w.Priority,
        Title               = w.Title,
        Description         = w.Description,
        AssignedToId        = w.AssignedToId,
        AssignedToName      = w.AssignedTo != null ? $"{w.AssignedTo.FirstName} {w.AssignedTo.LastName}" : null,
        CreatedById         = w.CreatedById,
        CreatedByName       = w.CreatedBy != null ? $"{w.CreatedBy.FirstName} {w.CreatedBy.LastName}" : null,
        InboundOrderId      = w.InboundOrderId,
        InboundOrderNumber  = w.InboundOrder?.OrderNumber,
        OutboundOrderId     = w.OutboundOrderId,
        OutboundOrderNumber = w.OutboundOrder?.OrderNumber,
        ProductId           = w.ProductId,
        ProductName         = w.Product?.Name,
        FromLocationId      = w.FromLocationId,
        FromLocationCode    = w.FromLocation?.Code,
        ToLocationId        = w.ToLocationId,
        ToLocationCode      = w.ToLocation?.Code,
        Quantity            = w.Quantity,
        DueDate             = w.DueDate,
        CompletedAt         = w.CompletedAt,
        CompletionNote      = w.CompletionNote,
        CreatedAt           = w.CreatedAt,
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<bool> IsAdminAsync()
    {
        var userId = _currentUser.UserId;
        if (userId == null) return false;
        return await _context.UserRoles
            .Join(_context.Roles,
                ur => ur.RoleId,
                r  => r.Id,
                (ur, r) => new { ur.UserId, r.Name })
            .AnyAsync(x => x.UserId == userId && x.Name == "Admin");
    }

    private async Task<bool> IsManagerOrAdminAsync()
    {
        var userId = _currentUser.UserId;
        if (userId == null) return false;
        return await _context.UserRoles
            .Join(_context.Roles,
                ur => ur.RoleId,
                r  => r.Id,
                (ur, r) => new { ur.UserId, r.Name })
            .AnyAsync(x => x.UserId == userId &&
                           (x.Name == "Admin" || x.Name == "Manager"));
    }

    // ── Public methods ────────────────────────────────────────────────────────

    public async Task<IEnumerable<WorkOrderDto>> GetAllAsync(WorkOrderStatus? status = null)
    {
        var query = BaseQuery();

        if (!await IsAdminAsync())
        {
            var userId = _currentUser.UserId;
            query = query.Where(w => w.AssignedToId == userId);
        }

        if (status.HasValue)
            query = query.Where(w => w.Status == status.Value);

        return (await query.OrderByDescending(w => w.CreatedAt).ToListAsync()).Select(ToDto);
    }

    public async Task<PagedResult<WorkOrderDto>> GetPagedAsync(GetWorkOrdersQuery query)
    {
        var q = BaseQuery();

        if (query.FreeOnly)
        {
            // Вільні завдання — без виконавця, тільки Pending
            q = q.Where(w => w.AssignedToId == null && w.Status == WorkOrderStatus.Pending);
        }
        else if (query.MyOnly || !await IsManagerOrAdminAsync())
        {
            // Мої завдання або Worker — бачить тільки свої
            var userId = _currentUser.UserId;
            q = q.Where(w => w.AssignedToId == userId);
        }

        if (query.Status.HasValue)
            q = q.Where(w => w.Status == query.Status.Value);

        q = q.OrderByDescending(w => w.CreatedAt);

        var totalCount = await q.CountAsync();
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        return new PagedResult<WorkOrderDto>
        {
            Items      = items.Select(ToDto).ToList(),
            Page       = query.Page,
            PageSize   = query.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<IEnumerable<WorkOrderDto>> GetMyTasksAsync()
    {
        var userId = _currentUser.UserId;
        return (await BaseQuery()
            .Where(w => w.AssignedToId == userId
                     && w.Status != WorkOrderStatus.Completed
                     && w.Status != WorkOrderStatus.Cancelled)
            .OrderBy(w => w.Priority)
            .ThenBy(w => w.DueDate)
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
            Type            = request.Type,
            Title           = request.Title,
            Description     = request.Description,
            Priority        = request.Priority,
            AssignedToId    = request.AssignedToId,
            CreatedById     = _currentUser.UserId!.Value,
            InboundOrderId  = request.InboundOrderId,
            OutboundOrderId = request.OutboundOrderId,
            ProductId       = request.ProductId,
            FromLocationId  = request.FromLocationId,
            ToLocationId    = request.ToLocationId,
            Quantity        = request.Quantity,
            DueDate         = request.DueDate.HasValue
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

        workOrder.Status         = request.Status;
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

    // Взяти вільне завдання собі
    public async Task<WorkOrderDto> TakeAsync(Guid id)
    {
        var workOrder = await _context.WorkOrders.FindAsync(id)
            ?? throw new Exception("Завдання не знайдено");

        if (workOrder.AssignedToId != null)
            throw new Exception("Завдання вже має виконавця");

        if (workOrder.Status != WorkOrderStatus.Pending)
            throw new Exception("Можна взяти тільки завдання зі статусом 'Очікує'");

        workOrder.AssignedToId = _currentUser.UserId;
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

    public async Task<NotificationsDto> GetNotificationsAsync()
    {
        var userId = _currentUser.UserId;
        if (userId == null) return new NotificationsDto();

        var items = await _context.WorkOrders
            .Where(w =>
                w.AssignedToId == userId &&
                w.Status == WorkOrderStatus.Pending)
            .OrderByDescending(w => w.Priority)
            .ThenBy(w => w.CreatedAt)
            .Take(10)
            .Select(w => new NotificationItem
            {
                Id        = w.Id,
                Title     = w.Title,
                Type      = w.Type.ToString(),
                Priority  = w.Priority.ToString(),
                CreatedAt = w.CreatedAt,
                IsUrgent  = w.Priority == WorkOrderPriority.Urgent || w.Priority == WorkOrderPriority.High,
            })
            .AsNoTracking()
            .ToListAsync();

        return new NotificationsDto
        {
            TotalCount = items.Count,
            Items      = items,
        };
    }
}