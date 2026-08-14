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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof (ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByWarehouse(Guid warehouseId) => 
        Ok(await _structureService.GetZonesAsync(warehouseId));

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id) =>
        Ok(await _structureService.GetZoneByIdAsync(id));
    
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateZoneRequest request)
    {
        var created = await _structureService.CreateZoneAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateZoneRequest request) => 
        Ok(await _structureService.UpdateZoneAsync(id, request));

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _structureService.DeleteZoneAsync(id);
        return NoContent();
    }
}