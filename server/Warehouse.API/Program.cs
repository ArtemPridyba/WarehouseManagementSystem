using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;
using System.Text.Json.Serialization;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Application.Services;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;

var builder = WebApplication.CreateBuilder(args);

// 1. Конфігурація контролерів та JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Ігноруємо циклічні посилання (наприклад, Warehouse -> Tenant -> Warehouse)
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 2. Swagger та OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Підключення до БД (PostgreSQL)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsAssembly("Warehouse.API") 
    ));

// 4. Налаштування CORS для майбутнього фронтенда на React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInboundService, InboundService>();
builder.Services.AddScoped<IOutboundService, OutboundService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IStructureService, StructureService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IInboundOrderService, InboundOrderService>();

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    if (!context.Tenants.Any())
    {
        var tenant = new Tenant { Name = "Enterprise Logistics" };
        context.Tenants.Add(tenant);
        
        var product = new Product { 
            TenantId = tenant.Id, 
            Name = "iPhone 15 Pro", 
            SKU = "AAPL-IPH15P-256",
            IsBatchTracked = true 
        };
        context.Products.Add(product);
        
        var warehouse = new Warehouse.API.Domain.Entities.Warehouse { 
            TenantId = tenant.Id, Name = "Main Kyiv Warehouse" 
        };
        var zone = new Zone { 
            TenantId = tenant.Id, Warehouse = warehouse, Name = "A-Zone" 
        };
        
        var receivingLoc = new Location { 
            TenantId = tenant.Id, Zone = zone, Code = "REC-01", Type = LocationType.Receiving 
        };
        
        var storageLoc = new Location { 
            TenantId = tenant.Id, Zone = zone, Code = "STR-01-A", Type = LocationType.Storage 
        };
        
        context.Locations.AddRange(receivingLoc, storageLoc);
        
        var order = new InboundOrder { 
            TenantId = tenant.Id, 
            OrderNumber = "PO-1001", 
            Status = OrderStatus.InProgress 
        };
        var orderItem = new InboundOrderItem { 
            InboundOrder = order, 
            ProductId = product.Id, 
            Quantity = 10 
        };
        
        context.InboundOrders.Add(order);
        context.InboundOrderItems.Add(orderItem);

        var outboundOrder = new OutboundOrder {
            TenantId = tenant.Id,
            OrderNumber = "SO-5001",
            CustomerName = "ООО 'Ромашка'",
            Status = OrderStatus.InProgress
        };
        var outboundItem = new OutboundOrderItem {
            OutboundOrder = outboundOrder,
            ProductId = product.Id,
            Quantity = 5
        };
        context.OutboundOrders.Add(outboundOrder);
        context.OutboundOrderItems.Add(outboundItem);

        context.SaveChanges();

        Console.WriteLine("=== ТЕСТОВІ ДАНІ СТВОРЕНО ===");
        Console.WriteLine($"Tenant ID:   {tenant.Id}");
        Console.WriteLine($"Order ID:    {order.Id}");
        Console.WriteLine($"Product ID:  {product.Id}");
        Console.WriteLine($"Receiving Loc: {receivingLoc.Id}");
        Console.WriteLine($"Storage Loc:   {storageLoc.Id}");
        Console.WriteLine($"Outbound Order ID: {outboundOrder.Id}");
        Console.WriteLine("==============================");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();  
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();