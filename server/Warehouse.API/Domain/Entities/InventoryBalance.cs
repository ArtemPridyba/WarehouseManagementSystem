using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class InventoryBalance : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; }

    public decimal Quantity { get; set; }
}