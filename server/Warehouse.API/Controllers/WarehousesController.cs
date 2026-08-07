using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly IStructureService _structureService;
    public WarehousesController(IStructureService structureService) => _structureService = structureService;

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() => Ok(await _structureService.GetWarehousesAsync());

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id) 
    {
        var warehouse = await _structureService.GetWarehouseByIdAsync(id);
        return Ok(warehouse);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseRequest request) => 
        Ok(await _structureService.CreateWarehouseAsync(request));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateWarehouseRequest request) => 
        Ok(await _structureService.UpdateWarehouseAsync(id, request));

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id) 
    {
        await _structureService.DeleteWarehouseAsync(id);
        return NoContent();
    }
}