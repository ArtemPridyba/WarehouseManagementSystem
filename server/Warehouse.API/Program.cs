using Microsoft.EntityFrameworkCore;
using Warehouse.API.Infrastructure.Data;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Application.Services;
using Warehouse.API.Domain.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Warehouse.API.Infrastructure.Services;
using Warehouse.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();

builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInboundService, InboundService>();
builder.Services.AddScoped<IOutboundService, OutboundService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IStructureService, StructureService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IInboundOrderService, InboundOrderService>();
builder.Services.AddScoped<IOutboundOrderService, OutboundOrderService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IWorkOrderService, WorkOrderService>();
builder.Services.AddScoped<IDbInitializer, DbInitializer>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDbInitializer>();
    await initializer.InitializeAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();  
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseMiddleware<TenantResolverMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();