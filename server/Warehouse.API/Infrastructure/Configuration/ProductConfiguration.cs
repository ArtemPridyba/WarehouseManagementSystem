using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Infrastructure.Configuration;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SKU).IsRequired().HasMaxLength(50);
        builder.HasIndex(x => new { x.TenantId, x.SKU }).IsUnique();
    }
}