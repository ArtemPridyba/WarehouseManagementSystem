using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Auth;
using Warehouse.API.Application.Interfaces;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return Unauthorized(ex.Message);
        }
    }
    
    [Authorize(Roles = "Admin")]
    [HttpPost("add-employee")]
    public async Task<IActionResult> AddEmployee([FromBody] CreateEmployeeRequest request)
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim)) return Unauthorized();
    
        var tenantId = Guid.Parse(tenantIdClaim);

        try
        {
            await _authService.RegisterEmployeeAsync(tenantId, request);
            return Ok("Співробітника успішно додано до вашої компанії");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
    
    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim)) return Unauthorized();
    
        var tenantId = Guid.Parse(tenantIdClaim);
        var employees = await _authService.GetEmployeesAsync(tenantId);
        return Ok(employees);
    }
    
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
        var tenantId = User.FindFirst("TenantId")?.Value;
        var fullName = User.FindFirst("FullName")?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        return Ok(new {
            Id = userIdClaim,
            Email = email,
            FullName = fullName,
            Role = role,
            TenantId = tenantId,
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        try
        {
            var response = await _authService.UpdateProfileAsync(Guid.Parse(userIdClaim), request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        try
        {
            await _authService.ChangePasswordAsync(Guid.Parse(userIdClaim), request);
            return Ok("Пароль успішно змінено");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}