using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<ProductCategory>> GetAllAsync();
    Task<ProductCategory> CreateAsync(UpsertCategoryRequest request);
    Task<ProductCategory> UpdateAsync(Guid id, UpsertCategoryRequest request);
    Task<bool> DeleteAsync(Guid id);
}