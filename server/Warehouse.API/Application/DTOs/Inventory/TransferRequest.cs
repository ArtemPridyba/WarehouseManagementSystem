using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Inventory;

public record TransferRequest
{
    [Required]
    public Guid ProductId { get; init; }

    [Required]
    public Guid FromLocationId { get; init; }

    [Required]
    public Guid ToLocationId { get; init; }

    // BatchId може бути null
    public Guid? BatchId { get; init; }

    [Required]
    [Range(0.001, 999999, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; init; }
}