using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Inbound;
using Warehouse.API.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InboundController : ControllerBase
{
    private readonly IInboundService _inboundService;
    private readonly ApplicationDbContext _context;

    public InboundController(IInboundService inboundService, ApplicationDbContext context)
    {
        _inboundService = inboundService;
        _context = context;
    }

    [HttpPost("receive")]
    public async Task<IActionResult> Receive([FromBody] ReceiveProductRequest request)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null) return BadRequest("Tenant not found");

        try 
        {
            var result = await _inboundService.ReceiveProductAsync(tenant.Id, request);
            return Ok("Товар успішно прийнято на склад");
        }
        catch (Exception ex) 
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<InboundOrder>>> GetActiveOrders()
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        
        return await _context.InboundOrders
            .Where(o => o.TenantId == tenant.Id && o.Status != OrderStatus.Completed)
            .ToListAsync();
    }
}