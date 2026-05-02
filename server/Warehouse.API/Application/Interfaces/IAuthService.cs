using Warehouse.API.Application.DTOs.Auth;

namespace Warehouse.API.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<bool> RegisterEmployeeAsync(Guid tenantId, CreateEmployeeRequest request);
}