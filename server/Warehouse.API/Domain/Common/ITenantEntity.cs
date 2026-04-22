namespace Warehouse.API.Domain.Common;

public interface ITenantEntity
{
    Guid TenantId { get; set; }
}