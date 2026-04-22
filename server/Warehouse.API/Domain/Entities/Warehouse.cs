using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Warehouse : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; } 
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public ICollection<Zone> Zones { get; set; } = new List<Zone>();
}