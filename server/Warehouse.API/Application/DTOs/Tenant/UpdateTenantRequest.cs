namespace Warehouse.API.Application.DTOs.Tenant;
using System.ComponentModel.DataAnnotations;

public record UpdateTenantRequest(
    [Required, MaxLength(200)] string  Name,
    [MaxLength(200)]           string? Email,
    [MaxLength(50)]            string? Phone,
    [MaxLength(500)]           string? Address
);