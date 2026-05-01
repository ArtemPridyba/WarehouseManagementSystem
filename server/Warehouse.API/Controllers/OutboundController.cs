using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Outbound;
using Warehouse.API.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OutboundController : ControllerBase
{
    private readonly IOutboundService _outboundService;
    private readonly ApplicationDbContext _context;

    public OutboundController(IOutboundService outboundService, ApplicationDbContext context)
    {
        _outboundService = outboundService;
        _context = context;
    }

    [HttpPost("ship")]
    public async Task<IActionResult> Ship([FromBody] ShipProductRequest request)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null) return BadRequest("Tenant not found");

        try
        {
            await _outboundService.ShipProductAsync(tenant.Id, request);
            return Ok("Товар успішно відвантажено");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}