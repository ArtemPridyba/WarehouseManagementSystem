using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Zone : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = null!;
    
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<Location> Locations { get; set; } = new List<Location>();
}