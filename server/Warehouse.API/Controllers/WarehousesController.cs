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
    public async Task<IActionResult> GetAll() => Ok(await _structureService.GetWarehousesAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id) 
    {
        var warehouse = await _structureService.GetWarehouseByIdAsync(id);
        return warehouse == null ? NotFound() : Ok(warehouse);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseRequest request) => 
        Ok(await _structureService.CreateWarehouseAsync(request));

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateWarehouseRequest request) => 
        Ok(await _structureService.UpdateWarehouseAsync(id, request));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id) 
    {
        try { return await _structureService.DeleteWarehouseAsync(id) ? NoContent() : NotFound(); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }
}