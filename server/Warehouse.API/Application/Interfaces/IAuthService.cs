using Warehouse.API.Application.DTOs.Auth;

namespace Warehouse.API.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<bool> RegisterEmployeeAsync(Guid tenantId, CreateEmployeeRequest request);
    Task<IEnumerable<EmployeeDto>> GetEmployeesAsync(Guid tenantId);
    Task<AuthResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    // ── Employee CRUD ──────────────────────────────────────────────────────────
    Task<EmployeeDto> UpdateEmployeeAsync(Guid tenantId, Guid employeeId, UpdateEmployeeRequest request);
    Task DeleteEmployeeAsync(Guid tenantId, Guid employeeId);
    Task ResetEmployeePasswordAsync(Guid tenantId, Guid employeeId, ResetEmployeePasswordRequest request);
}