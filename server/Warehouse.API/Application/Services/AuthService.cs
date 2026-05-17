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
        {
            throw new Exception("Невірний email або пароль");
        }

        return await GenerateAuthResponse(user);
    }

    private async Task<AuthResponse> GenerateAuthResponse(AppUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

        // ВАЖЛИВО: додаємо TenantId в токен, щоб Middleware міг його звідти дістати
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim("FullName", $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "Worker")
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
            ($"{user.FirstName} {user.LastName}")
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
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, request.Role);
            return true;
        }

        throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
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