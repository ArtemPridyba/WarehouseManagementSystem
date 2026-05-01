using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly IStructureService _structureService;
    private readonly ApplicationDbContext _context;

    public LocationsController(IStructureService structureService, ApplicationDbContext context)
    {
        _structureService = structureService;
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Location>> GetById(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var location = await _structureService.GetLocationByIdAsync(tenant.Id, id);
        if (location == null) return NotFound();
        return Ok(location);
    }

    [HttpGet("zone/{zoneId}")]
    public async Task<ActionResult<IEnumerable<Location>>> GetByZone(Guid zoneId)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var locations = await _structureService.GetLocationsByZoneAsync(tenant.Id, zoneId);
        return Ok(locations);
    }

    [HttpPost]
    public async Task<ActionResult<Location>> Create([FromBody] CreateLocationRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try {
            var location = await _structureService.CreateLocationAsync(tenant.Id, request);
            return CreatedAtAction(nameof(GetById), new { id = location.Id }, location);
        } catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Location>> Update(Guid id, [FromBody] CreateLocationRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        return Ok(await _structureService.UpdateLocationAsync(tenant.Id, id, request));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try {
            await _structureService.DeleteLocationAsync(tenant.Id, id);
            return NoContent();
        } catch (Exception ex) { return BadRequest(ex.Message); }
    }
}