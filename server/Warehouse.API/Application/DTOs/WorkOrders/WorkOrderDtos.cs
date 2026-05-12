using System.ComponentModel.DataAnnotations;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.DTOs.WorkOrders;

public record CreateWorkOrderRequest
{
    [Required]
    public WorkOrderType Type { get; init; }

    [Required]
    [StringLength(200)]
    public string Title { get; init; } = null!;

    public string? Description { get; init; }

    public WorkOrderPriority Priority { get; init; } = WorkOrderPriority.Normal;

    public Guid? AssignedToId { get; init; }

    // Пов'язані сутності
    public Guid? InboundOrderId { get; init; }
    public Guid? OutboundOrderId { get; init; }
    public Guid? ProductId { get; init; }
    public Guid? FromLocationId { get; init; }
    public Guid? ToLocationId { get; init; }
    public decimal? Quantity { get; init; }
    public DateTime? DueDate { get; init; }
}

public record UpdateWorkOrderStatusRequest
{
    [Required]
    public WorkOrderStatus Status { get; init; }
    public string? CompletionNote { get; init; }
}

public record AssignWorkOrderRequest
{
    [Required]
    public Guid AssignedToId { get; init; }
}

public record WorkOrderDto
{
    public Guid Id { get; init; }
    public WorkOrderType Type { get; init; }
    public WorkOrderStatus Status { get; init; }
    public WorkOrderPriority Priority { get; init; }
    public string Title { get; init; } = null!;
    public string? Description { get; init; }

    public Guid? AssignedToId { get; init; }
    public string? AssignedToName { get; init; }

    public Guid CreatedById { get; init; }
    public string? CreatedByName { get; init; }

    public Guid? InboundOrderId { get; init; }
    public string? InboundOrderNumber { get; init; }

    public Guid? OutboundOrderId { get; init; }
    public string? OutboundOrderNumber { get; init; }

    public Guid? ProductId { get; init; }
    public string? ProductName { get; init; }

    public Guid? FromLocationId { get; init; }
    public string? FromLocationCode { get; init; }

    public Guid? ToLocationId { get; init; }
    public string? ToLocationCode { get; init; }

    public decimal? Quantity { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? CompletionNote { get; init; }
    public DateTime CreatedAt { get; init; }
}