using Microsoft.AspNetCore.Identity;

namespace Warehouse.API.Domain.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}