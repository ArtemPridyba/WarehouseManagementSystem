using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IInventoryService
{
    Task<bool> InternalTransferAsync(Guid tenantId, TransferRequest request);
    Task<IEnumerable<object>> GetAvailableLocationsForProductAsync(Guid tenantId, Guid productId);
    Task<IEnumerable<InventoryBalance>> GetWarehouseStockAsync(Guid tenantId, Guid warehouseId);
    Task<bool> AdjustStockAsync(Guid tenantId, AdjustmentRequest request);
}