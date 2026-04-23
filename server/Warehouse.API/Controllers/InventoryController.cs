using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ApplicationDbContext _context;

    public InventoryController(IInventoryService inventoryService, ApplicationDbContext context)
    {
        _inventoryService = inventoryService;
        _context = context;
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferRequest request)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null) return BadRequest("Tenant not found");

        var result = await _inventoryService.InternalTransferAsync(tenant.Id, request);

        if (!result) return BadRequest("Не вдалося виконати переміщення (перевірте залишки)");
        
        return Ok(new { Message = "Товар успішно переміщено" });
    }
    
    [HttpGet("stock/{warehouseId}")]
    public async Task<IActionResult> GetStock(Guid warehouseId)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null) return BadRequest("Tenant not found");

        var stock = await _inventoryService.GetWarehouseStockAsync(tenant.Id, warehouseId);
    
        // Формуємо красиву відповідь для фронтенда
        var result = stock.Select(s => new {
            ProductName = s.Product?.Name,
            SKU = s.Product?.SKU,
            Location = s.Location?.Code,
            Batch = s.Batch?.BatchNumber,
            ExpiryDate = s.Batch?.ExpirationDate,
            Quantity = s.Quantity
        });

        return Ok(result);
    }
}