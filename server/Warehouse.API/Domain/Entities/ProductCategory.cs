using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class ProductCategory : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}