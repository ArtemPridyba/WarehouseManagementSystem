using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Warehouse.API.Application.DTOs.Auth;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<AppUser> userManager, ApplicationDbContext context, IConfiguration configuration)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var tenant = new Tenant { Name = request.CompanyName };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            var user = new AppUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                TenantId = tenant.Id
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Помилка реєстрації: {errors}");
            }

            await _userManager.AddToRoleAsync(user, "Admin");
            await transaction.CommitAsync();
            return await GenerateAuthResponse(user);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            throw new Exception("Невірний email або пароль");

        return await GenerateAuthResponse(user);
    }

    private async Task<AuthResponse> GenerateAuthResponse(AppUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new("TenantId", user.TenantId.ToString()),
            new("FullName", $"{user.FirstName} {user.LastName}"),
            new(ClaimTypes.Role, (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "Worker")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:DurationInMinutes"]!)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"]
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return new AuthResponse(
            tokenHandler.WriteToken(token),
            user.Email!,
            user.TenantId,
            $"{user.FirstName} {user.LastName}"
        );
    }

    public async Task<bool> RegisterEmployeeAsync(Guid tenantId, CreateEmployeeRequest request)
    {
        var allowedRoles = new[] { "Manager", "Worker" };
        if (!allowedRoles.Contains(request.Role))
            throw new Exception($"Недозволена роль: {request.Role}");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            TenantId = tenantId
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, request.Role);
        return true;
    }

    public async Task<IEnumerable<EmployeeDto>> GetEmployeesAsync(Guid tenantId)
    {
        var users = await _userManager.Users
            .Where(u => u.TenantId == tenantId)
            .ToListAsync();

        var result = new List<EmployeeDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new EmployeeDto(
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email!,
                roles.FirstOrDefault() ?? "Worker",
                user.CreatedAt
            ));
        }
        return result;
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(Guid tenantId, Guid employeeId, UpdateEmployeeRequest request)
    {
        var allowedRoles = new[] { "Manager", "Worker" };
        if (!allowedRoles.Contains(request.Role))
            throw new Exception($"Недозволена роль: {request.Role}");

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == employeeId && u.TenantId == tenantId)
            ?? throw new Exception("Користувача не знайдено");

        // Перевіряємо що не редагуємо Admin
        var currentRoles = await _userManager.GetRolesAsync(user);
        if (currentRoles.Contains("Admin"))
            throw new Exception("Не можна редагувати адміністратора");

        user.FirstName = request.FirstName;
        user.LastName  = request.LastName;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new Exception(string.Join(", ", updateResult.Errors.Select(e => e.Description)));

        // Оновлюємо роль якщо змінилась
        var currentRole = currentRoles.FirstOrDefault();
        if (currentRole != request.Role)
        {
            if (currentRole != null)
                await _userManager.RemoveFromRoleAsync(user, currentRole);
            await _userManager.AddToRoleAsync(user, request.Role);
        }

        var roles = await _userManager.GetRolesAsync(user);
        return new EmployeeDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email!,
            roles.FirstOrDefault() ?? "Worker",
            user.CreatedAt
        );
    }

    public async Task DeleteEmployeeAsync(Guid tenantId, Guid employeeId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == employeeId && u.TenantId == tenantId)
            ?? throw new Exception("Користувача не знайдено");

        // Перевіряємо що не видаляємо Admin
        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("Admin"))
            throw new Exception("Не можна видалити адміністратора");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task ResetEmployeePasswordAsync(Guid tenantId, Guid employeeId, ResetEmployeePasswordRequest request)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == employeeId && u.TenantId == tenantId)
            ?? throw new Exception("Користувача не знайдено");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("Admin"))
            throw new Exception("Не можна скидати пароль адміністратора");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task<AuthResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
                   ?? throw new Exception("Користувача не знайдено");

        user.FirstName = request.FirstName;
        user.LastName  = request.LastName;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));

        return await GenerateAuthResponse(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
                   ?? throw new Exception("Користувача не знайдено");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
    }
}