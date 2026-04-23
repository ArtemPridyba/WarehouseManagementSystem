using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IInventoryService
{
    Task<bool> InternalTransferAsync(Guid tenantId, TransferRequest request);
    Task<IEnumerable<InventoryBalance>> GetWarehouseStockAsync(Guid tenantId, Guid warehouseId);
}