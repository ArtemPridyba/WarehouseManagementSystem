using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Outbound;

public record ShipProductRequest
{
    [Required]
    public Guid OutboundOrderId { get; init; }

    [Required]
    public Guid ProductId { get; init; }

    [Required]
    public Guid LocationId { get; init; } 

    public Guid? BatchId { get; init; } 

    [Required]
    [Range(0.001, 1000000)]
    public decimal Quantity { get; init; }
}