using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Common;
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

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        return await _context.Products
            .Include(p => p.Category)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid productId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId);
    }

    public async Task<Product> CreateAsync(UpsertProductRequest request)
    {
        var exists = await _context.Products.AnyAsync(p => p.SKU == request.SKU);
        if (exists) throw new Exception("Товар з таким SKU вже існує");

        var product = new Product
        {
            Name = request.Name,
            SKU = request.SKU,
            Barcode = request.Barcode,
            CategoryId = request.CategoryId,
            IsBatchTracked = request.IsBatchTracked,
            MinStock       = request.MinStock
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product> UpdateAsync(Guid productId, UpsertProductRequest request)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null) throw new Exception("Товар не знайдено");

        if (product.SKU != request.SKU)
        {
            var exists = await _context.Products.AnyAsync(p => p.SKU == request.SKU);
            if (exists) throw new Exception("Новий SKU вже зайнятий");
        }

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Barcode = request.Barcode;
        product.CategoryId = request.CategoryId;
        product.IsBatchTracked = request.IsBatchTracked;
        product.MinStock = request.MinStock;

        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> DeleteAsync(Guid productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return false;

        var hasStock = await _context.InventoryBalances.AnyAsync(b => b.ProductId == productId);
        if (hasStock) throw new Exception("Неможливо видалити товар, який є на складі");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<PagedResult<Product>> GetPagedAsync(GetProductsQuery query)
    {
        var q = _context.Products
            .Include(p => p.Category)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            q = q.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.SKU.ToLower().Contains(search) ||
                (p.Barcode != null && p.Barcode.Contains(search)));
        }

        if (query.CategoryId.HasValue)
            q = q.Where(p => p.CategoryId == query.CategoryId.Value);

        q = q.OrderBy(p => p.Name);

        return await q.ToPagedResultAsync(query);
    }
}