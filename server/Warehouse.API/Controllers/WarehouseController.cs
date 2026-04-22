using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;
using WarehouseEntity = Warehouse.API.Domain.Entities.Warehouse;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WarehousesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WarehouseEntity>>> GetWarehouses()
    {
        var warehouses = await _context.Warehouses
            .Include(w => w.Tenant) 
            .AsNoTracking()
            .ToListAsync();
            
        return Ok(warehouses);
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseEntity>> CreateWarehouse([FromBody] CreateWarehouseRequest request)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null)
        {
            tenant = new Tenant { Name = "Default Tenant" };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
        }

        var warehouse = new WarehouseEntity
        {
            Name = request.Name,
            Address = request.Address,
            TenantId = tenant.Id
        };

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        return Ok(warehouse);
    }
}

public record CreateWarehouseRequest(string Name, string? Address);