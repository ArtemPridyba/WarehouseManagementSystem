using Warehouse.API.Domain.Common;

namespace Warehouse.API.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = null!;

    // Контактна інформація
    public string? Email   { get; set; }
    public string? Phone   { get; set; }
    public string? Address { get; set; }

    // Тарифний план (read-only для UI)
    public string    PlanName      { get; set; } = "Free";
    public DateTime? PlanExpiresAt { get; set; }

    public ICollection<AppUser> Users { get; set; } = [];
}