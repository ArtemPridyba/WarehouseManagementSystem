namespace Warehouse.API.Application.DTOs.Dashboard;

public record LowStockDto(
    Guid   ProductId,
    string ProductName,
    string SKU,
    decimal CurrentStock,
    decimal MinStock,
    decimal Deficit
);