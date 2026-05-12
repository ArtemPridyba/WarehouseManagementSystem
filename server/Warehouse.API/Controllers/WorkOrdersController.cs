using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.WorkOrders;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;

    public WorkOrdersController(IWorkOrderService workOrderService)
    {
        _workOrderService = workOrderService;
    }

    // Всі завдання (Admin бачить всі, Worker — тільки свої)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] WorkOrderStatus? status = null)
    {
        var orders = await _workOrderService.GetAllAsync(status);
        return Ok(orders);
    }

    // Мої завдання (для Worker)
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTasks()
    {
        var tasks = await _workOrderService.GetMyTasksAsync();
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _workOrderService.GetByIdAsync(id);
        return order == null ? NotFound() : Ok(order);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkOrderRequest request)
    {
        try
        {
            var order = await _workOrderService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Оновити статус (Worker може виконати своє завдання)
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateWorkOrderStatusRequest request)
    {
        try
        {
            var order = await _workOrderService.UpdateStatusAsync(id, request);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Призначити виконавця (тільки Admin)
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/assign")]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignWorkOrderRequest request)
    {
        try
        {
            var order = await _workOrderService.AssignAsync(id, request);
            return Ok(order);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var success = await _workOrderService.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}