using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Orders;

public record OutboundOrderRequest
{
    [Required]
    [StringLength(50)]
    public string OrderNumber { get; init; } = null!;

    [Required]
    [StringLength(200)]
    public string CustomerName { get; init; } = null!;

    [Required]
    [MinLength(1, ErrorMessage = "Замовлення повинно містити хоча б один товар")]
    public List<OutboundOrderItemRequest> Items { get; init; } = new();
}

public record OutboundOrderItemRequest
{
    [Required]
    public Guid ProductId { get; init; }

    [Required]
    [Range(0.001, 1000000, ErrorMessage = "Кількість повинна бути більшою за 0")]
    public decimal Quantity { get; init; }
}