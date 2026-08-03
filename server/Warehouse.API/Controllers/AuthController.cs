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
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (Exception ex) { return Unauthorized(ex.Message); }
    }
    

    [Authorize(Roles = "Admin")]
    [HttpPost("employees")]
    public async Task<IActionResult> AddEmployee([FromBody] CreateEmployeeRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();
        try
        {
            await _authService.RegisterEmployeeAsync(tenantId.Value, request);
            var employees = await _authService.GetEmployeesAsync(tenantId.Value);
            var created = employees.FirstOrDefault(e => e.Email == request.Email);
            return Ok(created);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();
        var employees = await _authService.GetEmployeesAsync(tenantId.Value);
        return Ok(employees);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();
        try
        {
            var employee = await _authService.UpdateEmployeeAsync(tenantId.Value, id, request);
            return Ok(employee);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("employees/{id}")]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();
        try
        {
            await _authService.DeleteEmployeeAsync(tenantId.Value, id);
            return NoContent();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("employees/{id}/reset-password")]
    public async Task<IActionResult> ResetEmployeePassword(Guid id, [FromBody] ResetEmployeePasswordRequest request)
    {
        var tenantId = GetTenantId();
        if (tenantId == null) return Unauthorized();
        try
        {
            await _authService.ResetEmployeePasswordAsync(tenantId.Value, id, request);
            return Ok("Пароль успішно змінено");
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }


    [Authorize]
    [HttpGet("me")]
    public IActionResult GetMe()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        return Ok(new
        {
            Id       = userIdClaim,
            Email    = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
            FullName = User.FindFirst("FullName")?.Value,
            Role     = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
            TenantId = User.FindFirst("TenantId")?.Value,
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
        catch (Exception ex) { return BadRequest(ex.Message); }
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
        catch (Exception ex) { return BadRequest(ex.Message); }
    }
    
    private Guid? GetTenantId()
    {
        var claim = User.FindFirst("TenantId")?.Value;
        return string.IsNullOrEmpty(claim) ? null : Guid.Parse(claim);
    }
}