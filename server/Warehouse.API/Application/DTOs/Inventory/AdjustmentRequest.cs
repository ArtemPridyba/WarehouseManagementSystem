using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Inventory;

public record AdjustmentRequest
{
    [Required]
    public Guid ProductId { get; init; }

    [Required]
    public Guid LocationId { get; init; }

    public Guid? BatchId { get; init; }

    [Required]
    [Range(0, 1000000, ErrorMessage = "Кількість не може бути від'ємною")]
    public decimal NewQuantity { get; init; }

    [Required]
    [StringLength(200)]
    public string Reason { get; init; } = "Cycle Count"; 
}