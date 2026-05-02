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
    
    [Authorize] 
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
}