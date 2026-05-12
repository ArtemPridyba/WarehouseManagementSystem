using Warehouse.API.Domain.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Domain.Entities;

public class WorkOrder : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    
    public WorkOrderType Type { get; set; }
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Pending;
    public WorkOrderPriority Priority { get; set; } = WorkOrderPriority.Normal;
    
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    
    // Призначений виконавець
    public Guid? AssignedToId { get; set; }
    public AppUser? AssignedTo { get; set; }
    
    // Хто створив
    public Guid CreatedById { get; set; }
    public AppUser? CreatedBy { get; set; }
    
    // Пов'язані сутності (опціонально)
    public Guid? InboundOrderId { get; set; }
    public InboundOrder? InboundOrder { get; set; }
    
    public Guid? OutboundOrderId { get; set; }
    public OutboundOrder? OutboundOrder { get; set; }
    
    // Деталі операції (JSON або окремі поля)
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    
    public Guid? FromLocationId { get; set; }
    public Location? FromLocation { get; set; }
    
    public Guid? ToLocationId { get; set; }
    public Location? ToLocation { get; set; }
    
    public decimal? Quantity { get; set; }
    
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    public string? CompletionNote { get; set; }
}