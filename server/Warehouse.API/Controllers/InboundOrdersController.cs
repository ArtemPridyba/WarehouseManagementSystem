using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Orders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InboundOrdersController : ControllerBase
{
    private readonly IInboundOrderService _orderService;
    private readonly ApplicationDbContext _context;

    public InboundOrdersController(IInboundOrderService orderService, ApplicationDbContext context)
    {
        _orderService = orderService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InboundOrder>>> GetAll()
    {
        var tenant = await _context.Tenants.FirstAsync();
        return Ok(await _orderService.GetAllAsync(tenant.Id));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InboundOrder>> GetById(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var order = await _orderService.GetByIdAsync(tenant.Id, id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<InboundOrder>> Create([FromBody] InboundOrderRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var order = await _orderService.CreateAsync(tenant.Id, request);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var success = await _orderService.DeleteAsync(tenant.Id, id);
            if (!success) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}