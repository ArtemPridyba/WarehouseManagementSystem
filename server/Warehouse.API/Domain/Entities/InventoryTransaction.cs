using Warehouse.API.Domain.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Domain.Entities;

public class InventoryTransaction : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? FromLocationId { get; set; } // Може бути null для приходу
    public Location? FromLocation { get; set; }

    public Guid? ToLocationId { get; set; } // Може бути null для відвантаження
    public Location? ToLocation { get; set; }

    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; }

    public decimal Quantity { get; set; }
    public TransactionType Type { get; set; } // Наприклад: Inbound, Transfer, Outbound
    
    public string? Reference { get; set; } // Номер замовлення або коментар
}