using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductCategory>> GetAllAsync()
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<ProductCategory> CreateAsync(UpsertCategoryRequest request)
    {
        var exists = await _context.Categories.AnyAsync(c => c.Name == request.Name);
        if (exists) throw new Exception("Категорія з такою назвою вже існує");

        var category = new ProductCategory { Name = request.Name };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<ProductCategory> UpdateAsync(Guid id, UpsertCategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) throw new Exception("Категорію не знайдено");

        category.Name = request.Name;
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return false;

        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts) throw new Exception("Неможливо видалити — є товари з цією категорією");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }
}