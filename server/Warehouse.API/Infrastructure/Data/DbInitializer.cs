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
            await SeedTenantOneAsync();
            await SeedTenantTwoAsync();
        }
    }

    private async Task SeedTenantOneAsync()
    {
        // 1. Тенант
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Global Logistics Group" };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        // 2. Користувачі (Адмін та Воркер)
        var admin = new AppUser { Id = Guid.NewGuid(), UserName = "admin@global.com", Email = "admin@global.com", FirstName = "Олексій", LastName = "Адмін", TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(admin, "Admin123!");
        await _userManager.AddToRoleAsync(admin, "Admin");

        var worker = new AppUser { Id = Guid.NewGuid(), UserName = "worker@global.com", Email = "worker@global.com", FirstName = "Іван", LastName = "Комірник", TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(worker, "Worker123!");
        await _userManager.AddToRoleAsync(worker, "Worker");

        // 3. Склади (Київ та Львів)
        var whKyiv = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Київський Розподільчий Центр", Address = "Київ, вул. Велика Окружна" };
        var whLviv = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Львівський Хаб", Address = "Львів, вул. Стрийська" };
        _context.Warehouses.AddRange(whKyiv, whLviv);
        await _context.SaveChangesAsync();

        // 4. Зони та Локації для Києва
        var zoneA = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id, Name = "Зона Стелажного Зберігання" };
        var zoneRec = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id, Name = "Зона Приймання" };
        _context.Zones.AddRange(zoneA, zoneRec);
        await _context.SaveChangesAsync();

        var loc1 = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneA.Id, Code = "A-01-01", Type = LocationType.Storage };
        var locRec = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneRec.Id, Code = "REC-01", Type = LocationType.Receiving };
        _context.Locations.AddRange(loc1, locRec);

        // 5. Товари
        var p1 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "iPhone 15 Pro", SKU = "AAPL-IP15P-256", IsBatchTracked = true };
        var p2 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "MacBook Pro M3", SKU = "AAPL-MBP-M3-14", IsBatchTracked = false };
        _context.Products.AddRange(p1, p2);
        await _context.SaveChangesAsync();

        // 6. Замовлення на прихід (Inbound)
        var inOrder = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-GL-001", Status = OrderStatus.InProgress, CreatedAt = DateTime.UtcNow };
        _context.InboundOrders.Add(inOrder);
        _context.InboundOrderItems.Add(new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder.Id, ProductId = p1.Id, Quantity = 50, ReceivedQuantity = 0 });
        
        // 7. Замовлення на відправку (Outbound)
        var outOrder = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-GL-001", CustomerName = "Магазин Епл-Світ", Status = OrderStatus.Draft, CreatedAt = DateTime.UtcNow };
        _context.OutboundOrders.Add(outOrder);
        _context.OutboundOrderItems.Add(new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder.Id, ProductId = p2.Id, Quantity = 5, ShippedQuantity = 0 });

        await _context.SaveChangesAsync();
    }

    private async Task SeedTenantTwoAsync()
    {
        // 1. Тенант 2
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = "Fast Ship Co" };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        // 2. Користувач
        var admin = new AppUser { Id = Guid.NewGuid(), UserName = "admin@fastship.com", Email = "admin@fastship.com", FirstName = "Дмитро", LastName = "Одеса", TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(admin, "Admin123!");
        await _userManager.AddToRoleAsync(admin, "Admin");

        // 3. Склад Одеса
        var whOdesa = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Одеський Термінал", Address = "Одеса, Морський Порт" };
        _context.Warehouses.Add(whOdesa);
        await _context.SaveChangesAsync();

        var zoneCool = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whOdesa.Id, Name = "Холодильна Камера" };
        _context.Zones.Add(zoneCool);
        await _context.SaveChangesAsync();

        _context.Locations.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneCool.Id, Code = "COLD-01", Type = LocationType.Storage });

        // 4. Товар
        var p3 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Енергетик Red Bull", SKU = "DRINK-RB-033", IsBatchTracked = true };
        _context.Products.Add(p3);
        await _context.SaveChangesAsync();

        // 5. Замовлення
        var inOrder = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-FS-99", Status = OrderStatus.Draft, CreatedAt = DateTime.UtcNow };
        _context.InboundOrders.Add(inOrder);
        _context.InboundOrderItems.Add(new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder.Id, ProductId = p3.Id, Quantity = 1000, ReceivedQuantity = 0 });

        await _context.SaveChangesAsync();
    }
}