namespace Warehouse.API.Application.DTOs.Tenant;

public record TenantDto(
    Guid      Id,
    string    Name,
    string?   Email,
    string?   Phone,
    string?   Address,
    DateTime  CreatedAt,
    string    PlanName,
    DateTime? PlanExpiresAt,
    int       WarehouseCount,
    int       UserCount,
    int       ProductCount,
    int       TransactionCount,
    int       ActiveInboundOrders,
    int       ActiveOutboundOrders
);