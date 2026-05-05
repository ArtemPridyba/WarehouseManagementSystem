using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Outbound;
using Warehouse.API.Application.Interfaces;

namespace Warehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OutboundController : ControllerBase
{
    private readonly IOutboundService _outboundService;

    public OutboundController(IOutboundService outboundService)
    {
        _outboundService = outboundService;
    }
    
    [HttpPost("ship")]
    public async Task<IActionResult> Ship([FromBody] ShipProductRequest request)
    {
        try
        {
            await _outboundService.ShipProductAsync(request);
            return Ok(new { Message = "Товар успішно відвантажено" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}