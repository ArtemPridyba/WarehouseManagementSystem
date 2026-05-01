using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Application.Services;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Domain.Enums;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
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

builder.Services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInboundService, InboundService>();
builder.Services.AddScoped<IOutboundService, OutboundService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IStructureService, StructureService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IInboundOrderService, InboundOrderService>();
builder.Services.AddScoped<IOutboundOrderService, OutboundOrderService>();
builder.Services.AddScoped<IAuthService, AuthService>();

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();