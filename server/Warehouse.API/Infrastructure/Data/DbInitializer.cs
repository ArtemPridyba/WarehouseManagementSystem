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
        _context     = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task InitializeAsync()
    {
        if ((await _context.Database.GetPendingMigrationsAsync()).Any())
            await _context.Database.MigrateAsync();

        string[] roles = { "Admin", "Manager", "Worker" };
        foreach (var roleName in roles)
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName));

        if (!await _context.Tenants.AnyAsync())
        {
            await SeedTenantOneAsync();
            await SeedTenantTwoAsync();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ТЕНАНТ 1 — Global Logistics Group
    // ─────────────────────────────────────────────────────────────────────────
    private async Task SeedTenantOneAsync()
    {
        var tenant = new Tenant
        {
            Id            = Guid.NewGuid(),
            Name          = "Global Logistics Group",
            Email         = "info@global-logistics.ua",
            Phone         = "+380 44 123 45 67",
            Address       = "м. Київ, вул. Велика Окружна, 4",
            PlanName      = "Pro",
            PlanExpiresAt = DateTime.UtcNow.AddMonths(8),
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        // Користувачі
        var admin = new AppUser { Id = Guid.NewGuid(), UserName = "admin@global.com",    Email = "admin@global.com",    FirstName = "Олексій", LastName = "Адмін",      TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(admin, "Admin123!");
        await _userManager.AddToRoleAsync(admin, "Admin");

        var manager1 = new AppUser { Id = Guid.NewGuid(), UserName = "manager@global.com",  Email = "manager@global.com",  FirstName = "Марина",  LastName = "Менеджер",   TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(manager1, "Manager123!");
        await _userManager.AddToRoleAsync(manager1, "Manager");

        var manager2 = new AppUser { Id = Guid.NewGuid(), UserName = "manager2@global.com", Email = "manager2@global.com", FirstName = "Сергій",  LastName = "Коваль",     TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(manager2, "Manager123!");
        await _userManager.AddToRoleAsync(manager2, "Manager");

        var worker1 = new AppUser { Id = Guid.NewGuid(), UserName = "worker@global.com",   Email = "worker@global.com",   FirstName = "Іван",    LastName = "Комірник",   TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(worker1, "Worker123!");
        await _userManager.AddToRoleAsync(worker1, "Worker");

        var worker2 = new AppUser { Id = Guid.NewGuid(), UserName = "worker2@global.com",  Email = "worker2@global.com",  FirstName = "Олена",   LastName = "Петренко",   TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(worker2, "Worker123!");
        await _userManager.AddToRoleAsync(worker2, "Worker");

        var worker3 = new AppUser { Id = Guid.NewGuid(), UserName = "worker3@global.com",  Email = "worker3@global.com",  FirstName = "Василь",  LastName = "Бондаренко", TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(worker3, "Worker123!");
        await _userManager.AddToRoleAsync(worker3, "Worker");

        // Категорії
        var catElec   = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Електроніка" };
        var catComput = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Комп'ютери та ноутбуки" };
        var catAccess = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Аксесуари" };
        var catAudio  = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Аудіо" };
        _context.Categories.AddRange(catElec, catComput, catAccess, catAudio);
        await _context.SaveChangesAsync();

        // Склади
        var whKyiv  = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Київський Розподільчий Центр", Address = "Київ, вул. Велика Окружна, 4" };
        var whLviv  = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Львівський Хаб",               Address = "Львів, вул. Стрийська, 45"    };
        var whKhark = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Харківський Склад",            Address = "Харків, пр. Науки, 12"        };
        _context.Warehouses.AddRange(whKyiv, whLviv, whKhark);
        await _context.SaveChangesAsync();

        // Зони
        var zoneKyivStorage  = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id,  Name = "Зона Стелажного Зберігання" };
        var zoneKyivReceiving = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id,  Name = "Зона Приймання"             };
        var zoneKyivShipping  = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id,  Name = "Зона Відвантаження"         };
        var zoneKyivBulk      = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKyiv.Id,  Name = "Зона Великогабаритного Товару" };
        var zoneLvivStorage   = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whLviv.Id,  Name = "Основне Зберігання"         };
        var zoneLvivReceiving = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whLviv.Id,  Name = "Приймання"                  };
        var zoneKharkStorage  = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKhark.Id, Name = "Стелажна Зона А"            };
        var zoneKharkCold     = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whKhark.Id, Name = "Температурна Зона"          };
        _context.Zones.AddRange(zoneKyivStorage, zoneKyivReceiving, zoneKyivShipping, zoneKyivBulk, zoneLvivStorage, zoneLvivReceiving, zoneKharkStorage, zoneKharkCold);
        await _context.SaveChangesAsync();

        // Локації — Київ (стелажі A-D, 3 полиці, 2 комірки)
        var locKyiv = new List<Location>();
        foreach (var row in new[] { "A", "B", "C", "D" })
            for (int shelf = 1; shelf <= 3; shelf++)
                for (int cell = 1; cell <= 2; cell++)
                    locKyiv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKyivStorage.Id, Code = $"{row}-{shelf:D2}-{cell:D2}", Type = LocationType.Storage });

        for (int i = 1; i <= 3; i++)
            locKyiv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKyivReceiving.Id, Code = $"REC-{i:D2}",  Type = LocationType.Receiving });
        for (int i = 1; i <= 3; i++)
            locKyiv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKyivShipping.Id,  Code = $"SHIP-{i:D2}", Type = LocationType.Shipping  });
        for (int i = 1; i <= 2; i++)
            locKyiv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKyivBulk.Id,     Code = $"BULK-{i:D2}", Type = LocationType.Storage   });

        // Локації — Львів
        var locLviv = new List<Location>();
        foreach (var row in new[] { "A", "B" })
            for (int shelf = 1; shelf <= 3; shelf++)
                locLviv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneLvivStorage.Id, Code = $"LV-{row}-{shelf:D2}", Type = LocationType.Storage });
        locLviv.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneLvivReceiving.Id, Code = "LV-REC-01", Type = LocationType.Receiving });

        // Локації — Харків
        var locKhark = new List<Location>();
        foreach (var row in new[] { "A", "B", "C" })
            for (int shelf = 1; shelf <= 2; shelf++)
                locKhark.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKharkStorage.Id, Code = $"KH-{row}-{shelf:D2}", Type = LocationType.Storage });
        locKhark.Add(new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneKharkCold.Id, Code = "KH-COLD-01", Type = LocationType.Storage });

        _context.Locations.AddRange(locKyiv);
        _context.Locations.AddRange(locLviv);
        _context.Locations.AddRange(locKhark);
        await _context.SaveChangesAsync();

        var locA0101 = locKyiv.First(l => l.Code == "A-01-01");
        var locA0102 = locKyiv.First(l => l.Code == "A-01-02");
        var locB0101 = locKyiv.First(l => l.Code == "B-01-01");
        var locB0201 = locKyiv.First(l => l.Code == "B-02-01");
        var locC0101 = locKyiv.First(l => l.Code == "C-01-01");
        var locLvA1  = locLviv.First(l  => l.Code == "LV-A-01");
        var locKhA1  = locKhark.First(l => l.Code == "KH-A-01");

        // Товари
        var p1  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "iPhone 15 Pro 256GB",    SKU = "AAPL-IP15P-256",  Barcode = "0194253411420", CategoryId = catElec.Id,   IsBatchTracked = true,  MinStock = 10 };
        var p2  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "MacBook Pro 14\" M3",    SKU = "AAPL-MBP-M3-14",  Barcode = "0194253718551", CategoryId = catComput.Id, IsBatchTracked = false, MinStock = 5  };
        var p3  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "iPad Air 5 64GB",        SKU = "AAPL-IPAD-A5-64", Barcode = "0194252660347", CategoryId = catElec.Id,   IsBatchTracked = false, MinStock = 8  };
        var p4  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "AirPods Pro 2",          SKU = "AAPL-APP2",        Barcode = "0194253378972", CategoryId = catAudio.Id,  IsBatchTracked = false, MinStock = 15 };
        var p5  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Apple Watch SE 2",       SKU = "AAPL-AWS-SE2",     Barcode = "0194253407058", CategoryId = catElec.Id,   IsBatchTracked = false, MinStock = 6  };
        var p6  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "USB-C кабель 2м",        SKU = "ACC-USBC-2M",      Barcode = "4711234567890", CategoryId = catAccess.Id, IsBatchTracked = false, MinStock = 50 };
        var p7  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "MagSafe Charger 15W",    SKU = "AAPL-MGSF-15W",   Barcode = "0194252630883", CategoryId = catAccess.Id, IsBatchTracked = false, MinStock = 20 };
        var p8  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Samsung Galaxy S24 128", SKU = "SAM-S24-128",      Barcode = "8806095049892", CategoryId = catElec.Id,   IsBatchTracked = true,  MinStock = 8  };
        var p9  = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Sony WH-1000XM5",        SKU = "SONY-WH1000XM5",   Barcode = "4548736132283", CategoryId = catAudio.Id,  IsBatchTracked = false, MinStock = 5  };
        var p10 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Logitech MX Master 3",   SKU = "LOG-MX-M3",        Barcode = "5099206082571", CategoryId = catAccess.Id, IsBatchTracked = false, MinStock = 10 };
        _context.Products.AddRange(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10);
        await _context.SaveChangesAsync();

        // Партії
        var batch1 = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id, BatchNumber = "BATCH-IP15-2024-01", ExpirationDate = null };
        var batch2 = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id, BatchNumber = "BATCH-IP15-2024-02", ExpirationDate = null };
        var batch3 = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p8.Id, BatchNumber = "BATCH-S24-2024-01",  ExpirationDate = null };
        _context.Batches.AddRange(batch1, batch2, batch3);
        await _context.SaveChangesAsync();

        // Залишки
        _context.InventoryBalances.AddRange(
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locA0101.Id, ProductId = p1.Id,  BatchId = batch1.Id, Quantity = 24 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locA0102.Id, ProductId = p1.Id,  BatchId = batch2.Id, Quantity = 18 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locB0101.Id, ProductId = p2.Id,  BatchId = null,      Quantity = 7  },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locB0201.Id, ProductId = p3.Id,  BatchId = null,      Quantity = 12 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locC0101.Id, ProductId = p4.Id,  BatchId = null,      Quantity = 30 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locA0101.Id, ProductId = p5.Id,  BatchId = null,      Quantity = 4  }, // нижче мінімуму
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locC0101.Id, ProductId = p6.Id,  BatchId = null,      Quantity = 85 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locLvA1.Id,  ProductId = p6.Id,  BatchId = null,      Quantity = 40 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locB0101.Id, ProductId = p7.Id,  BatchId = null,      Quantity = 22 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locLvA1.Id,  ProductId = p8.Id,  BatchId = batch3.Id, Quantity = 15 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locKhA1.Id,  ProductId = p9.Id,  BatchId = null,      Quantity = 3  }, // нижче мінімуму
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locKhA1.Id,  ProductId = p10.Id, BatchId = null,      Quantity = 11 }
        );
        await _context.SaveChangesAsync();

        // Транзакції
        var now = DateTime.UtcNow;
        _context.InventoryTransactions.AddRange(
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id,  ToLocationId = locA0101.Id, BatchId = batch1.Id, Quantity = 24,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-14), CreatedByUserId = worker1.Id,  Reference = "IN-GL-001" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id,  ToLocationId = locA0102.Id, BatchId = batch2.Id, Quantity = 18,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-10), CreatedByUserId = worker1.Id,  Reference = "IN-GL-002" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p2.Id,  ToLocationId = locB0101.Id, BatchId = null,      Quantity = 10,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-12), CreatedByUserId = worker2.Id,  Reference = "IN-GL-003" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p2.Id,  FromLocationId = locB0101.Id, BatchId = null,     Quantity = 3,   Type = TransactionType.Outbound,   CreatedAt = now.AddDays(-5),  CreatedByUserId = worker1.Id,  Reference = "OUT-GL-001" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p3.Id,  ToLocationId = locB0201.Id, BatchId = null,      Quantity = 20,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-8),  CreatedByUserId = worker2.Id,  Reference = "IN-GL-004" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p3.Id,  FromLocationId = locB0201.Id, BatchId = null,     Quantity = 8,   Type = TransactionType.Outbound,   CreatedAt = now.AddDays(-3),  CreatedByUserId = worker1.Id,  Reference = "OUT-GL-002" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p4.Id,  ToLocationId = locC0101.Id, BatchId = null,      Quantity = 30,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-6),  CreatedByUserId = worker3.Id,  Reference = "IN-GL-005" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p5.Id,  ToLocationId = locA0101.Id, BatchId = null,      Quantity = 10,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-20), CreatedByUserId = worker2.Id,  Reference = "IN-GL-006" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p5.Id,  FromLocationId = locA0101.Id, BatchId = null,     Quantity = 6,   Type = TransactionType.Outbound,   CreatedAt = now.AddDays(-2),  CreatedByUserId = worker1.Id,  Reference = "OUT-GL-003" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p6.Id,  ToLocationId = locC0101.Id, BatchId = null,      Quantity = 85,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-15), CreatedByUserId = worker3.Id,  Reference = "IN-GL-007" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p6.Id,  ToLocationId = locLvA1.Id,  BatchId = null,      Quantity = 40,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-15), CreatedByUserId = worker2.Id,  Reference = "IN-GL-007" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p7.Id,  ToLocationId = locB0101.Id, BatchId = null,      Quantity = 22,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-9),  CreatedByUserId = worker3.Id,  Reference = "IN-GL-008" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p8.Id,  ToLocationId = locLvA1.Id,  BatchId = batch3.Id, Quantity = 15,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-4),  CreatedByUserId = worker2.Id,  Reference = "IN-GL-009" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p9.Id,  ToLocationId = locKhA1.Id,  BatchId = null,      Quantity = 8,   Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-7),  CreatedByUserId = worker1.Id,  Reference = "IN-GL-010" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p9.Id,  FromLocationId = locKhA1.Id, BatchId = null,     Quantity = 5,   Type = TransactionType.Outbound,   CreatedAt = now.AddDays(-1),  CreatedByUserId = worker1.Id,  Reference = "OUT-GL-004" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p10.Id, ToLocationId = locKhA1.Id,  BatchId = null,      Quantity = 11,  Type = TransactionType.Inbound,    CreatedAt = now.AddDays(-11), CreatedByUserId = worker3.Id,  Reference = "IN-GL-011" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id,  ToLocationId = locA0101.Id, BatchId = batch1.Id, Quantity = 2,   Type = TransactionType.Adjustment, CreatedAt = now.AddDays(-2),  CreatedByUserId = manager1.Id, Reference = "ADJ-GL-001" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p6.Id,  FromLocationId = locC0101.Id, ToLocationId = locLvA1.Id, BatchId = null, Quantity = 3, Type = TransactionType.Transfer, CreatedAt = now.AddDays(-3), CreatedByUserId = worker2.Id, Reference = "TRF-GL-001" }
        );
        await _context.SaveChangesAsync();

        // Inbound замовлення
        var inOrder1 = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-GL-012", Status = OrderStatus.InProgress, CreatedAt = now.AddDays(-1) };
        var inOrder2 = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-GL-013", Status = OrderStatus.Draft,      CreatedAt = now            };
        var inOrder3 = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-GL-014", Status = OrderStatus.Completed,  CreatedAt = now.AddDays(-20) };
        _context.InboundOrders.AddRange(inOrder1, inOrder2, inOrder3);
        await _context.SaveChangesAsync();

        _context.InboundOrderItems.AddRange(
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder1.Id, ProductId = p1.Id,  Quantity = 50,  ReceivedQuantity = 0   },
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder1.Id, ProductId = p4.Id,  Quantity = 20,  ReceivedQuantity = 0   },
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder2.Id, ProductId = p2.Id,  Quantity = 5,   ReceivedQuantity = 0   },
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder2.Id, ProductId = p10.Id, Quantity = 30,  ReceivedQuantity = 0   },
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder3.Id, ProductId = p6.Id,  Quantity = 100, ReceivedQuantity = 100 },
            new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder3.Id, ProductId = p7.Id,  Quantity = 22,  ReceivedQuantity = 22  }
        );

        // Outbound замовлення
        var outOrder1 = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-GL-005", CustomerName = "Магазин Епл-Світ",   Status = OrderStatus.InProgress, CreatedAt = now.AddDays(-1) };
        var outOrder2 = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-GL-006", CustomerName = "ТОВ Техно-Партнер",  Status = OrderStatus.Draft,      CreatedAt = now            };
        var outOrder3 = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-GL-007", CustomerName = "Розетка Дистрибуція", Status = OrderStatus.Completed,  CreatedAt = now.AddDays(-5) };
        var outOrder4 = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-GL-008", CustomerName = "Comfy Retail Group",  Status = OrderStatus.Draft,      CreatedAt = now            };
        _context.OutboundOrders.AddRange(outOrder1, outOrder2, outOrder3, outOrder4);
        await _context.SaveChangesAsync();

        _context.OutboundOrderItems.AddRange(
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder1.Id, ProductId = p2.Id,  Quantity = 3,  ShippedQuantity = 0 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder1.Id, ProductId = p4.Id,  Quantity = 10, ShippedQuantity = 0 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder2.Id, ProductId = p1.Id,  Quantity = 5,  ShippedQuantity = 0 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder2.Id, ProductId = p8.Id,  Quantity = 3,  ShippedQuantity = 0 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder3.Id, ProductId = p3.Id,  Quantity = 8,  ShippedQuantity = 8 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder3.Id, ProductId = p9.Id,  Quantity = 5,  ShippedQuantity = 5 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder4.Id, ProductId = p7.Id,  Quantity = 8,  ShippedQuantity = 0 },
            new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder4.Id, ProductId = p10.Id, Quantity = 5,  ShippedQuantity = 0 }
        );
        await _context.SaveChangesAsync();

        // WorkOrders
        _context.WorkOrders.AddRange(
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Receive,  Title = "Прийняти iPhone 15 Pro — IN-GL-012",    Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.High,   AssignedToId = worker1.Id, CreatedById = manager1.Id, CreatedAt = now.AddDays(-1) },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Ship,     Title = "Відвантажити OUT-GL-005 (Епл-Світ)",     Status = WorkOrderStatus.InProgress, Priority = WorkOrderPriority.High,   AssignedToId = worker2.Id, CreatedById = manager1.Id, CreatedAt = now.AddDays(-1) },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Count,    Title = "Інвентаризація зони A (Київ)",            Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.Normal, AssignedToId = worker3.Id, CreatedById = manager2.Id, CreatedAt = now            },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Transfer, Title = "Перемістити USB-C кабелі у Зону C",      Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.Low,    AssignedToId = worker1.Id, CreatedById = manager2.Id, CreatedAt = now            },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Adjust,   Title = "Коригування залишку AirPods Pro",         Status = WorkOrderStatus.Completed,  Priority = WorkOrderPriority.Normal, AssignedToId = worker2.Id, CreatedById = manager1.Id, CreatedAt = now.AddDays(-3) },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Receive,  Title = "Прийняти MacBook Pro — IN-GL-013",       Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.Normal, AssignedToId = worker3.Id, CreatedById = manager1.Id, CreatedAt = now            },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Ship,     Title = "Підготувати відвантаження OUT-GL-006",    Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.Urgent, AssignedToId = worker1.Id, CreatedById = manager2.Id, CreatedAt = now            }
        );
        await _context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ТЕНАНТ 2 — Fast Ship Co
    // ─────────────────────────────────────────────────────────────────────────
    private async Task SeedTenantTwoAsync()
    {
        var tenant = new Tenant
        {
            Id       = Guid.NewGuid(),
            Name     = "Fast Ship Co",
            Email    = "ops@fastship.ua",
            Phone    = "+380 48 987 65 43",
            Address  = "м. Одеса, Морський Порт, буд. 1",
            PlanName = "Free",
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        var admin = new AppUser { Id = Guid.NewGuid(), UserName = "admin@fastship.com",  Email = "admin@fastship.com",  FirstName = "Дмитро", LastName = "Одеса",    TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(admin, "Admin123!");
        await _userManager.AddToRoleAsync(admin, "Admin");

        var worker = new AppUser { Id = Guid.NewGuid(), UserName = "worker@fastship.com", Email = "worker@fastship.com", FirstName = "Андрій", LastName = "Портовий", TenantId = tenant.Id, EmailConfirmed = true };
        await _userManager.CreateAsync(worker, "Worker123!");
        await _userManager.AddToRoleAsync(worker, "Worker");

        var catDrink = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Напої" };
        var catFood  = new ProductCategory { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Харчові продукти" };
        _context.Categories.AddRange(catDrink, catFood);
        await _context.SaveChangesAsync();

        var whOdesa = new Domain.Entities.Warehouse { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Одеський Термінал", Address = "Одеса, Морський Порт, 1" };
        _context.Warehouses.Add(whOdesa);
        await _context.SaveChangesAsync();

        var zoneCold = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whOdesa.Id, Name = "Холодильна Камера" };
        var zoneDry  = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whOdesa.Id, Name = "Суха Зона"         };
        var zoneRec  = new Zone { Id = Guid.NewGuid(), TenantId = tenant.Id, WarehouseId = whOdesa.Id, Name = "Приймання"         };
        _context.Zones.AddRange(zoneCold, zoneDry, zoneRec);
        await _context.SaveChangesAsync();

        var locCold1 = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneCold.Id, Code = "COLD-01", Type = LocationType.Storage   };
        var locCold2 = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneCold.Id, Code = "COLD-02", Type = LocationType.Storage   };
        var locDry1  = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneDry.Id,  Code = "DRY-01",  Type = LocationType.Storage   };
        var locDry2  = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneDry.Id,  Code = "DRY-02",  Type = LocationType.Storage   };
        var locRec1  = new Location { Id = Guid.NewGuid(), TenantId = tenant.Id, ZoneId = zoneRec.Id,  Code = "REC-01",  Type = LocationType.Receiving };
        _context.Locations.AddRange(locCold1, locCold2, locDry1, locDry2, locRec1);
        await _context.SaveChangesAsync();

        var p1 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Енергетик Red Bull 0.25л", SKU = "DRINK-RB-025", Barcode = "90162982", CategoryId = catDrink.Id, IsBatchTracked = true,  MinStock = 200 };
        var p2 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Coca-Cola 1.5л",           SKU = "DRINK-CC-15",  Barcode = "54491472", CategoryId = catDrink.Id, IsBatchTracked = true,  MinStock = 300 };
        var p3 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Мінеральна вода Моршин",   SKU = "DRINK-MW-05",  Barcode = "46791234", CategoryId = catDrink.Id, IsBatchTracked = false, MinStock = 150 };
        var p4 = new Product { Id = Guid.NewGuid(), TenantId = tenant.Id, Name = "Шоколад Roshen 100г",      SKU = "FOOD-RS-100",  Barcode = "46701234", CategoryId = catFood.Id,  IsBatchTracked = true,  MinStock = 100 };
        _context.Products.AddRange(p1, p2, p3, p4);
        await _context.SaveChangesAsync();

        var batch1       = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id, BatchNumber = "RB-2024-06-A",  ExpirationDate = DateTime.UtcNow.AddMonths(10) };
        var batch2       = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p2.Id, BatchNumber = "CC-2024-05-B",  ExpirationDate = DateTime.UtcNow.AddMonths(8)  };
        var batch3       = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p4.Id, BatchNumber = "RS-2024-03-A",  ExpirationDate = DateTime.UtcNow.AddMonths(4)  };
        var batchExpired = new Batch { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p4.Id, BatchNumber = "RS-2023-12-X",  ExpirationDate = DateTime.UtcNow.AddDays(-30)  };
        _context.Batches.AddRange(batch1, batch2, batch3, batchExpired);
        await _context.SaveChangesAsync();

        _context.InventoryBalances.AddRange(
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locCold1.Id, ProductId = p1.Id, BatchId = batch1.Id,      Quantity = 480 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locCold2.Id, ProductId = p2.Id, BatchId = batch2.Id,      Quantity = 720 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locDry1.Id,  ProductId = p3.Id, BatchId = null,           Quantity = 100 }, // нижче мінімуму
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locDry2.Id,  ProductId = p4.Id, BatchId = batch3.Id,      Quantity = 150 },
            new InventoryBalance { Id = Guid.NewGuid(), TenantId = tenant.Id, LocationId = locDry2.Id,  ProductId = p4.Id, BatchId = batchExpired.Id, Quantity = 50  }
        );
        await _context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        _context.InventoryTransactions.AddRange(
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id, ToLocationId   = locCold1.Id, BatchId = batch1.Id,      Quantity = 500,  Type = TransactionType.Inbound,  CreatedAt = now.AddDays(-5),  CreatedByUserId = worker.Id, Reference = "IN-FS-01"  },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p1.Id, FromLocationId = locCold1.Id, BatchId = batch1.Id,      Quantity = 20,   Type = TransactionType.Outbound, CreatedAt = now.AddDays(-2),  CreatedByUserId = worker.Id, Reference = "OUT-FS-01" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p2.Id, ToLocationId   = locCold2.Id, BatchId = batch2.Id,      Quantity = 720,  Type = TransactionType.Inbound,  CreatedAt = now.AddDays(-4),  CreatedByUserId = worker.Id, Reference = "IN-FS-02"  },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p3.Id, ToLocationId   = locDry1.Id,  BatchId = null,           Quantity = 200,  Type = TransactionType.Inbound,  CreatedAt = now.AddDays(-10), CreatedByUserId = worker.Id, Reference = "IN-FS-03"  },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p3.Id, FromLocationId = locDry1.Id,  BatchId = null,           Quantity = 100,  Type = TransactionType.Outbound, CreatedAt = now.AddDays(-3),  CreatedByUserId = worker.Id, Reference = "OUT-FS-02" },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p4.Id, ToLocationId   = locDry2.Id,  BatchId = batch3.Id,      Quantity = 150,  Type = TransactionType.Inbound,  CreatedAt = now.AddDays(-6),  CreatedByUserId = worker.Id, Reference = "IN-FS-04"  },
            new InventoryTransaction { Id = Guid.NewGuid(), TenantId = tenant.Id, ProductId = p4.Id, ToLocationId   = locDry2.Id,  BatchId = batchExpired.Id, Quantity = 50,  Type = TransactionType.Inbound,  CreatedAt = now.AddDays(-60), CreatedByUserId = worker.Id, Reference = "IN-FS-00"  }
        );
        await _context.SaveChangesAsync();

        var inOrder = new InboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "IN-FS-99", Status = OrderStatus.Draft, CreatedAt = now };
        _context.InboundOrders.Add(inOrder);
        await _context.SaveChangesAsync();
        _context.InboundOrderItems.Add(new InboundOrderItem { Id = Guid.NewGuid(), InboundOrderId = inOrder.Id, ProductId = p1.Id, Quantity = 1000, ReceivedQuantity = 0 });

        var outOrder = new OutboundOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, OrderNumber = "OUT-FS-10", CustomerName = "АТБ Маркет", Status = OrderStatus.InProgress, CreatedAt = now };
        _context.OutboundOrders.Add(outOrder);
        await _context.SaveChangesAsync();
        _context.OutboundOrderItems.Add(new OutboundOrderItem { Id = Guid.NewGuid(), OutboundOrderId = outOrder.Id, ProductId = p2.Id, Quantity = 100, ShippedQuantity = 0 });

        _context.WorkOrders.AddRange(
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Receive, Title = "Прийняти Red Bull — IN-FS-99",       Status = WorkOrderStatus.Pending,    Priority = WorkOrderPriority.High,   AssignedToId = worker.Id, CreatedById = admin.Id, CreatedAt = now            },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Ship,    Title = "Відвантажити Coca-Cola — OUT-FS-10",  Status = WorkOrderStatus.InProgress, Priority = WorkOrderPriority.Normal, AssignedToId = worker.Id, CreatedById = admin.Id, CreatedAt = now.AddDays(-1) },
            new WorkOrder { Id = Guid.NewGuid(), TenantId = tenant.Id, Type = WorkOrderType.Count,   Title = "Перевірити прострочений шоколад Roshen", Status = WorkOrderStatus.Pending, Priority = WorkOrderPriority.Urgent, AssignedToId = worker.Id, CreatedById = admin.Id, CreatedAt = now            }
        );
        await _context.SaveChangesAsync();
    }
}