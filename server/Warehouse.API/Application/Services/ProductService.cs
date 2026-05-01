using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;

    public ProductService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Product>> GetAllAsync(Guid tenantId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Where(p => p.TenantId == tenantId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid tenantId, Guid productId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == productId);
    }

    public async Task<Product> CreateAsync(Guid tenantId, UpsertProductRequest request)
    {
        // Перевірка на унікальність SKU
        var exists = await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.SKU == request.SKU);
        if (exists) throw new Exception("Товар з таким SKU вже існує");

        var product = new Product
        {
            TenantId = tenantId,
            Name = request.Name,
            SKU = request.SKU,
            Barcode = request.Barcode,
            CategoryId = request.CategoryId,
            IsBatchTracked = request.IsBatchTracked
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Guid tenantId, Guid productId, UpsertProductRequest request)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == productId);

        if (product == null) throw new Exception("Товар не знайдено");

        // Перевірка SKU, якщо він змінився
        if (product.SKU != request.SKU)
        {
            var exists = await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.SKU == request.SKU);
            if (exists) throw new Exception("Новий SKU вже зайнятий іншим товаром");
        }

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Barcode = request.Barcode;
        product.CategoryId = request.CategoryId;
        product.IsBatchTracked = request.IsBatchTracked;

        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> DeleteAsync(Guid tenantId, Guid productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null || product.TenantId != tenantId) return false;

        // ВАЖЛИВО: Перевіряємо, чи немає цього товару на залишках
        var hasStock = await _context.InventoryBalances.AnyAsync(b => b.ProductId == productId);
        if (hasStock) throw new Exception("Неможливо видалити товар, який є в наявності на складі");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }
}