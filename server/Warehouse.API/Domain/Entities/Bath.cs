using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Batch : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string BatchNumber { get; set; } = null!;
    public DateTime? ExpirationDate { get; set; }

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
}