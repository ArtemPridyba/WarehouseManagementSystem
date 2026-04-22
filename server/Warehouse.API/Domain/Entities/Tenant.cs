using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = null!;
}