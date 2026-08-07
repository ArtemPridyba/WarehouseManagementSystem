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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductLocations(Guid productId)
    {
            var locations = await _inventoryService.GetAvailableLocationsForProductAsync(productId);
            return Ok(locations);
    }

    [HttpPost("transfer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails),StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Transfer([FromBody] TransferRequest request)
    {
            await _inventoryService.InternalTransferAsync(request);
            return Ok(new { Message = "Товар успішно переміщено" });
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("adjust")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Adjust([FromBody] AdjustmentRequest request)
    {
            await _inventoryService.AdjustStockAsync(request);
            return Ok(new { Message = "Залишки успішно скориговано" });
    }
    
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IEnumerable<InventoryTransactionDto>),StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions([FromQuery] GetTransactionsQuery query)
    {
        var result = await _inventoryService.GetTransactionsAsync(query);
        return Ok(result);
    }
    
    [HttpPost("stock-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StockCount([FromBody] StockCountRequest request)
    {
            var result = await _inventoryService.ProcessStockCountAsync(request);
            return Ok(result);
    }
}