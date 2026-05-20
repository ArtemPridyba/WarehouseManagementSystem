namespace Warehouse.API.Application.DTOs.Inventory;

public record StockCountRequest
{
    public Guid WorkOrderId { get; init; }
    public Guid LocationId  { get; init; }
    public Guid ProductId   { get; init; }
    public Guid? BatchId    { get; init; }
    public decimal ActualQuantity { get; init; }
    public string? Note { get; init; }
}

public record StockCountResultDto
{
    public Guid   ProductId      { get; init; }
    public string ProductName    { get; init; } = "";
    public string LocationCode   { get; init; } = "";
    public decimal SystemQuantity { get; init; }
    public decimal ActualQuantity { get; init; }
    public decimal Discrepancy   { get; init; }
    public bool   HasDiscrepancy { get; init; }
}