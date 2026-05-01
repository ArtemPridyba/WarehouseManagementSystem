using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Infrastructure.Data;
using WarehouseEntity = Warehouse.API.Domain.Entities.Warehouse;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly IStructureService _structureService;
    private readonly ApplicationDbContext _context;

    public WarehousesController(IStructureService structureService, ApplicationDbContext context)
    {
        _structureService = structureService;
        _context = context;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WarehouseEntity>>> GetAll()
    {
        var tenant = await _context.Tenants.FirstAsync();
        var warehouses = await _structureService.GetWarehousesAsync(tenant.Id);
        return Ok(warehouses);
    }
    
    [HttpPost]
    public async Task<ActionResult<WarehouseEntity>> Create([FromBody] CreateWarehouseRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var warehouse = await _structureService.CreateWarehouseAsync(tenant.Id, request);
        return CreatedAtAction(nameof(GetAll), new { id = warehouse.Id }, warehouse);
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<WarehouseEntity>> Update(Guid id, [FromBody] CreateWarehouseRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var updated = await _structureService.UpdateWarehouseAsync(tenant.Id, id, request);
            return Ok(updated);
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
            var success = await _structureService.DeleteWarehouseAsync(tenant.Id, id);
            if (!success) return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<WarehouseEntity>> GetById(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var warehouse = await _structureService.GetWarehouseByIdAsync(tenant.Id, id);

        if (warehouse == null) return NotFound("Склад не знайдено");

        return Ok(warehouse);
    }
}