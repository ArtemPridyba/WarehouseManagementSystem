using Microsoft.EntityFrameworkCore;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ProductCategory> Categories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse.API.Domain.Entities.Warehouse> Warehouses => Set<Warehouse.API.Domain.Entities.Warehouse>();
    public DbSet<Zone> Zones => Set<Zone>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<InventoryBalance> InventoryBalances => Set<InventoryBalance>();
    public DbSet<InboundOrder> InboundOrders => Set<InboundOrder>();
    public DbSet<InboundOrderItem> InboundOrderItems => Set<InboundOrderItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("uuid-ossp");

        // Індекси для швидкодії та унікальності
        modelBuilder.Entity<Product>().HasIndex(p => new { p.TenantId, p.SKU }).IsUnique();
        modelBuilder.Entity<Location>().HasIndex(l => new { l.TenantId, l.Code }).IsUnique();
        modelBuilder.Entity<InventoryBalance>().HasIndex(b => new { b.LocationId, b.ProductId, b.BatchId }).IsUnique();
    }
}