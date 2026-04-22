using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Product : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string SKU { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Barcode { get; set; }

    public Guid? CategoryId { get; set; }
    public ProductCategory? Category { get; set; }

    public bool IsBatchTracked { get; set; }
    public bool IsSerialTracked { get; set; }
}