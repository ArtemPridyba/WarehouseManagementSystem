namespace Warehouse.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Tenant;
using Warehouse.API.Application.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantController(ITenantService tenantService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await tenantService.GetCurrentTenantAsync());

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] UpdateTenantRequest request)
        => Ok(await tenantService.UpdateTenantAsync(request));
}