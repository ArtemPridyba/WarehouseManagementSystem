using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.Auth;

public record UpdateProfileRequest
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; init; } = null!;

    [Required]
    [StringLength(50)]
    public string LastName { get; init; } = null!;
}

public record ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; init; } = null!;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; init; } = null!;
}