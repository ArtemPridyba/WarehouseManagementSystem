using Warehouse.API.Application.DTOs.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.DTOs.WorkOrders;

public record GetWorkOrdersQuery : PagedQuery
{
    public WorkOrderStatus? Status { get; init; }
    public bool MyOnly  { get; init; } = false;
    public bool FreeOnly { get; init; } = false;
}