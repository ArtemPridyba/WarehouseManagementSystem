using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllAsync(); 
    Task<Product?> GetByIdAsync(Guid productId);
    Task<Product> CreateAsync(UpsertProductRequest request);
    Task<Product> UpdateAsync(Guid productId, UpsertProductRequest request);
    Task<bool> DeleteAsync(Guid productId);
}