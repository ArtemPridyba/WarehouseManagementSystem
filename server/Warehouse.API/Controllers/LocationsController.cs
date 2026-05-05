using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly IStructureService _structureService;
    public LocationsController(IStructureService structureService) => _structureService = structureService;

    [HttpGet("zone/{zoneId}")]
    public async Task<IActionResult> GetByZone(Guid zoneId) => 
        Ok(await _structureService.GetLocationsByZoneAsync(zoneId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var location = await _structureService.GetLocationByIdAsync(id);
        return location == null ? NotFound() : Ok(location);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest request) => 
        Ok(await _structureService.CreateLocationAsync(request));

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateLocationRequest request) => 
        Ok(await _structureService.UpdateLocationAsync(id, request));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { return await _structureService.DeleteLocationAsync(id) ? NoContent() : NotFound(); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }
}