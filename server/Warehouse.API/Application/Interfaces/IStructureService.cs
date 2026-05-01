using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Domain.Entities;
using WarehouseEntity = Warehouse.API.Domain.Entities.Warehouse;

namespace Warehouse.API.Application.Interfaces;

public interface IStructureService
{
    Task<IEnumerable<Warehouse.API.Domain.Entities.Warehouse>> GetWarehousesAsync(Guid tenantId);
    Task<Warehouse.API.Domain.Entities.Warehouse> CreateWarehouseAsync(Guid tenantId, CreateWarehouseRequest request);
    Task<WarehouseEntity> UpdateWarehouseAsync(Guid tenantId, Guid id, CreateWarehouseRequest request);
    Task<bool> DeleteWarehouseAsync(Guid tenantId, Guid id);
    Task<WarehouseEntity?> GetWarehouseByIdAsync(Guid tenantId, Guid warehouseId);
    
    Task<IEnumerable<Zone>> GetZonesAsync(Guid tenantId, Guid warehouseId);
    Task<Zone> CreateZoneAsync(Guid tenantId, CreateZoneRequest request);
    Task<Zone?> GetZoneByIdAsync(Guid tenantId, Guid zoneId);
    Task<Zone> UpdateZoneAsync(Guid tenantId, Guid id, CreateZoneRequest request);
    Task<bool> DeleteZoneAsync(Guid tenantId, Guid id);
    
    Task<IEnumerable<Location>> GetLocationsByZoneAsync(Guid tenantId, Guid zoneId);
    Task<Location> CreateLocationAsync(Guid tenantId, CreateLocationRequest request);
    Task<Location?> GetLocationByIdAsync(Guid tenantId, Guid locationId);
    Task<Location> UpdateLocationAsync(Guid tenantId, Guid id, CreateLocationRequest request);
    Task<bool> DeleteLocationAsync(Guid tenantId, Guid locationId);
}