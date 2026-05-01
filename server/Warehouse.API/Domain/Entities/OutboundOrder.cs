using Warehouse.API.Domain.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Domain.Entities;

public class OutboundOrder : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string OrderNumber { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public OrderStatus Status { get; set; }
    
    public ICollection<OutboundOrderItem> Items { get; set; } = new List<OutboundOrderItem>();
}

public class OutboundOrderItem : BaseEntity
{
    public Guid OutboundOrderId { get; set; }
    public OutboundOrder OutboundOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal Quantity { get; set; }
    public decimal ShippedQuantity { get; set; } 
}