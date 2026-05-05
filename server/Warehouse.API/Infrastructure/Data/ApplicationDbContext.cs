using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Common;

namespace Warehouse.API.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    private readonly ICurrentUserContext _userContext;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserContext userContext) : base(options)
    {
        _userContext = userContext;
    }

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
    public DbSet<OutboundOrder> OutboundOrders => Set<OutboundOrder>();
    public DbSet<OutboundOrderItem> OutboundOrderItems => Set<OutboundOrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    
        modelBuilder.HasPostgresExtension("uuid-ossp");
        
        modelBuilder.Entity<AppUser>().ToTable("Users");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("Roles");

        modelBuilder.Entity<AppUser>()
            .HasOne(u => u.Tenant)
            .WithMany()
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<Product>().HasIndex(p => new { p.TenantId, p.SKU }).IsUnique();
        modelBuilder.Entity<Location>().HasIndex(l => new { l.TenantId, l.Code }).IsUnique();
        modelBuilder.Entity<InventoryBalance>().HasIndex(b => new { b.LocationId, b.ProductId, b.BatchId }).IsUnique();

        modelBuilder.Entity<Product>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<ProductCategory>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<Domain.Entities.Warehouse>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<Zone>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<Location>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<Batch>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<InventoryBalance>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<InboundOrder>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
        modelBuilder.Entity<OutboundOrder>().HasQueryFilter(e => e.TenantId == _userContext.TenantId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.TenantId == Guid.Empty && _userContext.TenantId.HasValue)
                {
                    entry.Entity.TenantId = _userContext.TenantId.Value;
                }
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}