namespace Warehouse.API.Application.DTOs.Inventory;

public class InventoryTransactionDto
{
    public Guid Id { get; set; }
    public string ProductName { get; set; } = "";
    public string SKU { get; set; } = "";
    public string Type { get; set; } = "";
    public decimal Quantity { get; set; }
    public string? FromLocation { get; set; }
    public string? FromZone { get; set; }
    public string? ToLocation { get; set; }
    public string? ToZone { get; set; }
    public string? BatchNumber { get; set; }
    public string? Reference { get; set; }
    public DateTime CreatedAt { get; set; }
}