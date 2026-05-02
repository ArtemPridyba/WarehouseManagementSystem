using System.Security.Claims;
using Warehouse.API.Application.Interfaces;

namespace Warehouse.API.Infrastructure.Services;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    public Guid? TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst("TenantId")?.Value;
            return claim != null ? Guid.Parse(claim) : null;
        }
    }
    
    public Guid? UserId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? Guid.Parse(claim) : null;
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}