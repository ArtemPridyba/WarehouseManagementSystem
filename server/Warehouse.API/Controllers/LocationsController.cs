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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByZone(Guid zoneId) => 
        Ok(await _structureService.GetLocationsByZoneAsync(zoneId));

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id) =>
        Ok(await _structureService.GetLocationByIdAsync(id));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest request)
    {
        var created = await _structureService.CreateLocationAsync(request);    
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
    

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateLocationRequest request) => 
        Ok(await _structureService.UpdateLocationAsync(id, request));

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _structureService.DeleteLocationAsync(id);
        return NoContent();
    }
}