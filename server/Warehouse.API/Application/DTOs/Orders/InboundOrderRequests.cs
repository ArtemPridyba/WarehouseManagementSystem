using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Orders;

public record InboundOrderRequest
{
    [Required]
    [StringLength(50)]
    public string OrderNumber { get; init; } = null!;

    [Required]
    [MinLength(1, ErrorMessage = "Замовлення повинно містити хоча б один товар")]
    public List<InboundOrderItemRequest> Items { get; init; } = new();
}

public record InboundOrderItemRequest
{
    [Required]
    public Guid ProductId { get; init; }

    [Required]
    [Range(0.001, 1000000, ErrorMessage = "Кількість повинна бути більшою за 0")]
    public decimal Quantity { get; init; }
}