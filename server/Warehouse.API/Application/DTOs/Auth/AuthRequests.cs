using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Auth;

public record RegisterRequest
{
    [Required] public string CompanyName { get; init; } = null!;
    [Required] public string FirstName { get; init; } = null!;
    [Required] public string LastName { get; init; } = null!;
    [Required] [EmailAddress] public string Email { get; init; } = null!;
    [Required] [MinLength(6)] public string Password { get; init; } = null!;
}

public record LoginRequest(
    [Required] [EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    string Email,
    Guid TenantId,
    string FullName
);