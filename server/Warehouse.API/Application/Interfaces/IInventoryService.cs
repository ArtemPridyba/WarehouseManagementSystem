using Warehouse.API.Application.DTOs.Common;
using Warehouse.API.Application.DTOs.Inventory;
using Warehouse.API.Domain.Entities;

namespace Warehouse.API.Application.Interfaces;

public interface IInventoryService
{
    Task<IEnumerable<InventoryBalance>> GetWarehouseStockAsync(Guid warehouseId);
    Task<IEnumerable<object>> GetAvailableLocationsForProductAsync(Guid productId);
    Task<bool> InternalTransferAsync(TransferRequest request);
    Task<bool> AdjustStockAsync(AdjustmentRequest request);
    Task<PagedResult<InventoryTransactionDto>> GetTransactionsAsync(GetTransactionsQuery query);
}