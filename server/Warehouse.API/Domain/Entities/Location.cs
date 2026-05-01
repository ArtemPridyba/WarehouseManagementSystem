using Warehouse.API.Domain.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Domain.Entities;

public class Location : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string Code { get; set; } = null!;
    
    public Guid ZoneId { get; set; }
    public Zone Zone { get; set; } = null!;
    public LocationType Type { get; set; }
}