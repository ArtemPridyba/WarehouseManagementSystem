namespace Warehouse.API.Application.Interfaces;

public interface ICurrentUserContext
{
    Guid? TenantId { get; }
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}