using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")] // Шлях: api/products
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ApplicationDbContext _context;

    public ProductsController(IProductService productService, ApplicationDbContext context)
    {
        _productService = productService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        var tenant = await _context.Tenants.FirstAsync();
        return Ok(await _productService.GetAllAsync(tenant.Id));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetById(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        var product = await _productService.GetByIdAsync(tenant.Id, id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] UpsertProductRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var product = await _productService.CreateAsync(tenant.Id, request);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Product>> Update(Guid id, [FromBody] UpsertProductRequest request)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var product = await _productService.UpdateAsync(tenant.Id, id, request);
            return Ok(product);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var success = await _productService.DeleteAsync(tenant.Id, id);
            if (!success) return NotFound();
            return NoContent(); // Стандарт REST для успішного видалення
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}