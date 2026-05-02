using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Infrastructure.Data;

public interface IDbInitializer
{
    Task InitializeAsync();
}

public class DbInitializer : IDbInitializer
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public DbInitializer(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task InitializeAsync()
    {
        if ((await _context.Database.GetPendingMigrationsAsync()).Any())
        {
            await _context.Database.MigrateAsync();
        }
        
        string[] roles = { "Admin", "Worker" };
        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            }
        }
        
        if (!await _context.Tenants.AnyAsync())
        {
            await SeedDemoDataAsync();
        }
    }

    private async Task SeedDemoDataAsync()
    {
        var tenant = new Tenant { Name = "Demo Logistics Corp" };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        
        var adminUser = new AppUser
        {
            UserName = "admin@wms.com",
            Email = "admin@wms.com",
            FirstName = "System",
            LastName = "Administrator",
            TenantId = tenant.Id,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(adminUser, "Admin123!");
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(adminUser, "Admin");
        }
        
        var warehouse = new Warehouse.API.Domain.Entities.Warehouse 
        { 
            TenantId = tenant.Id, 
            Name = "Центральний Склад", 
            Address = "Київ, вул. Магістральна 1" 
        };
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        var zone = new Zone { TenantId = tenant.Id, WarehouseId = warehouse.Id, Name = "Зона А (Стелажі)" };
        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();

        var location = new Location 
        { 
            TenantId = tenant.Id, 
            ZoneId = zone.Id, 
            Code = "A-01-01", 
            Type = LocationType.Storage 
        };
        _context.Locations.Add(location);
        
        var product = new Product
        {
            TenantId = tenant.Id,
            Name = "Тестовий Товар",
            SKU = "TEST-SKU-001",
            IsBatchTracked = false
        };
        _context.Products.Add(product);

        await _context.SaveChangesAsync();
    }
}