using Warehouse.API.Domain.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Domain.Entities;

public class InboundOrder : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string OrderNumber { get; set; } = null!;
    public OrderStatus Status { get; set; }
    public ICollection<InboundOrderItem> Items { get; set; } = new List<InboundOrderItem>();
}

public class InboundOrderItem : BaseEntity
{
    public InboundOrder InboundOrder { get; set; } = null!; 
    
    public Guid InboundOrderId { get; set; }
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
}