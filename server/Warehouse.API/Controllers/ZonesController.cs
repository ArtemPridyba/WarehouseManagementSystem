using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ZonesController : ControllerBase
{
    private readonly IStructureService _structureService;
    public ZonesController(IStructureService structureService) => _structureService = structureService;

    [HttpGet("warehouse/{warehouseId}")]
    public async Task<IActionResult> GetByWarehouse(Guid warehouseId) => 
        Ok(await _structureService.GetZonesAsync(warehouseId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var zone = await _structureService.GetZoneByIdAsync(id);
        return zone == null ? NotFound() : Ok(zone);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateZoneRequest request) => 
        Ok(await _structureService.CreateZoneAsync(request));

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateZoneRequest request) => 
        Ok(await _structureService.UpdateZoneAsync(id, request));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { return await _structureService.DeleteZoneAsync(id) ? NoContent() : NotFound(); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }
}