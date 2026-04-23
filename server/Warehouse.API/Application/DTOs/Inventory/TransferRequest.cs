using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Inventory;

public record TransferRequest(
    [property: Required] Guid ProductId,
    [property: Required] Guid FromLocationId,
    [property: Required] Guid ToLocationId,
    
    Guid? BatchId,

    [property: Required]
    [property: Range(0.001, 999999, ErrorMessage = "Кількість має бути більшою за 0")]
    decimal Quantity
);