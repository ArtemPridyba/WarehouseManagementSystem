using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllAsync(Guid tenantId);
    Task<Product?> GetByIdAsync(Guid tenantId, Guid productId);
    Task<Product> CreateAsync(Guid tenantId, UpsertProductRequest request);
    Task<Product> UpdateAsync(Guid tenantId, Guid productId, UpsertProductRequest request);
    Task<bool> DeleteAsync(Guid tenantId, Guid productId);
}