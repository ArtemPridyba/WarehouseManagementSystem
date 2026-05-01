using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

[ApiController]
[Route("api/[controller]")]
public class ZonesController : ControllerBase
{
    private readonly IStructureService _structureService;
    private readonly ApplicationDbContext _context;

    public ZonesController(IStructureService structureService, ApplicationDbContext context)
    {
        _structureService = structureService;
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Zone>> GetById(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var zone = await _structureService.GetZoneByIdAsync(tenant.Id, id);
        if (zone == null) return NotFound();
        return Ok(zone);
    }

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<ActionResult<IEnumerable<Zone>>> GetByWarehouse(Guid warehouseId)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var zones = await _structureService.GetZonesAsync(tenant.Id, warehouseId);
        return Ok(zones);
    }

    [HttpPost]
    public async Task<ActionResult<Zone>> Create([FromBody] CreateZoneRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var zone = await _structureService.CreateZoneAsync(tenant.Id, request);
        return CreatedAtAction(nameof(GetById), new { id = zone.Id }, zone);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Zone>> Update(Guid id, [FromBody] CreateZoneRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        return Ok(await _structureService.UpdateZoneAsync(tenant.Id, id, request));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try {
            await _structureService.DeleteZoneAsync(tenant.Id, id);
            return NoContent();
        } catch (Exception ex) { return BadRequest(ex.Message); }
    }
}