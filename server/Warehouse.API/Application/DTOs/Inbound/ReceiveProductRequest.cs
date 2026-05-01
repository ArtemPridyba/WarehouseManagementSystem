using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Inbound;

public record ReceiveProductRequest(
    [Required] Guid InboundOrderId,
    [Required] Guid ProductId,
    [Required] Guid LocationId,
    [Required] [Range(0.001, 1000000)] decimal Quantity,
    
    string? BatchNumber,
    DateTime? ExpirationDate
);