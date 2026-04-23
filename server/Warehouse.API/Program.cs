using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;
using System.Text.Json.Serialization;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Application.Services;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); 
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsAssembly("Warehouse.API") 
    ));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInboundService, InboundService>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Перевіряємо, чи є вже дані, щоб не дублювати
    if (!context.Tenants.Any())
    {
        // 1. Створюємо Тентанта
        var tenant = new Tenant { Name = "Test Logistics Corp" };
        context.Tenants.Add(tenant);

        // 2. Створюємо Товар
        var product = new Product { 
            TenantId = tenant.Id, 
            Name = "iPhone 15 Pro", 
            SKU = "AAPL-IPH15P-256",
            IsBatchTracked = true 
        };
        context.Products.Add(product);

        // 3. Створюємо Склад, Зону та Локацію
        var warehouse = new Warehouse.API.Domain.Entities.Warehouse { 
            TenantId = tenant.Id, Name = "Київський Склад" 
        };
        var zone = new Zone { 
            TenantId = tenant.Id, Warehouse = warehouse, Name = "Зона Приймання" 
        };
        var location = new Location { 
            TenantId = tenant.Id, Zone = zone, Code = "REC-01", Type = LocationType.Receiving 
        };
        context.Locations.Add(location);

        // 4. Створюємо Замовлення на прихід (Inbound Order)
        var order = new InboundOrder { 
            TenantId = tenant.Id, 
            OrderNumber = "PO-2024-001", 
            Status = OrderStatus.InProgress 
        };
        var orderItem = new InboundOrderItem { 
            InboundOrder = order, 
            ProductId = product.Id, 
            Quantity = 10 
        };
        context.InboundOrders.Add(order);
        context.InboundOrderItems.Add(orderItem);

        context.SaveChanges();

        // Виводимо ID в консоль, щоб ми могли їх скопіювати для Swagger
        Console.WriteLine("=== ТЕСТОВІ ДАНІ СТВОРЕНО ===");
        Console.WriteLine($"Tenant ID: {tenant.Id}");
        Console.WriteLine($"Order ID: {order.Id}");
        Console.WriteLine($"Product ID: {product.Id}");
        Console.WriteLine($"Location ID: {location.Id}");
        Console.WriteLine("==============================");
    }
}


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();  
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();