using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Inbound;
using Warehouse.API.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
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

        var result = await _inboundService.ReceiveProductAsync(tenant.Id, request);
        
        if (result) return Ok("Товар успішно прийнято на склад");
        return BadRequest("Помилка при прийманні");
    }
}