using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Inbound;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InboundController : ControllerBase
{
    private readonly IInboundService _inboundService;
    private readonly IInboundOrderService _orderService; 

    public InboundController(IInboundService inboundService, IInboundOrderService orderService)
    {
        _inboundService = inboundService;
        _orderService = orderService;
    }

    [HttpPost("receive")]
    public async Task<IActionResult> Receive([FromBody] ReceiveProductRequest request)
    {
        try 
        {
            await _inboundService.ReceiveProductAsync(request);
            return Ok(new { Message = "Товар успішно прийнято на склад" });
        }
        catch (Exception ex) 
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpGet("active-orders")]
    public async Task<ActionResult<IEnumerable<InboundOrder>>> GetActiveOrders()
    {
        var orders = await _orderService.GetAllAsync();
        var activeOrders = orders.Where(o => o.Status != OrderStatus.Completed);
        
        return Ok(activeOrders);
    }
}