using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Application.Interfaces;

namespace Warehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("stock/{warehouseId}")]
    public async Task<IActionResult> GetStock(Guid warehouseId)
    {
        var stock = await _inventoryService.GetWarehouseStockAsync(warehouseId);
        
        var result = stock.Select(s => new {
            ProductId = s.ProductId,
            ProductName = s.Product?.Name,
            SKU = s.Product?.SKU,
            Location = s.Location?.Code,
            LocationId = s.LocationId,
            ZoneName = s.Location?.Zone?.Name,
            Batch = s.Batch?.BatchNumber,
            BatchId = s.BatchId,
            ExpiryDate = s.Batch?.ExpirationDate,
            Quantity = s.Quantity
        });

        return Ok(result);
    }

    [HttpGet("product-locations/{productId}")]
    public async Task<IActionResult> GetProductLocations(Guid productId)
    {
        try
        {
            var locations = await _inventoryService.GetAvailableLocationsForProductAsync(productId);
            return Ok(locations);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferRequest request)
    {
        try
        {
            await _inventoryService.InternalTransferAsync(request);
            return Ok(new { Message = "Товар успішно переміщено" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustmentRequest request)
    {
        try
        {
            await _inventoryService.AdjustStockAsync(request);
            return Ok(new { Message = "Залишки успішно скориговано" });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] GetTransactionsQuery query)
    {
        var result = await _inventoryService.GetTransactionsAsync(query);
        return Ok(result);
    }
}