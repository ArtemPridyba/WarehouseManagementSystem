using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Domain.Entities;
using WarehouseEntity = Warehouse.API.Domain.Entities.Warehouse;

namespace Warehouse.API.Application.Interfaces;

public interface IStructureService
{
    Task<IEnumerable<WarehouseEntity>> GetWarehousesAsync();
    Task<WarehouseEntity?> GetWarehouseByIdAsync(Guid warehouseId);
    Task<WarehouseEntity> CreateWarehouseAsync(CreateWarehouseRequest request);
    Task<WarehouseEntity> UpdateWarehouseAsync(Guid id, CreateWarehouseRequest request);
    Task<bool> DeleteWarehouseAsync(Guid id);
    
    Task<IEnumerable<Zone>> GetZonesAsync(Guid warehouseId);
    Task<Zone?> GetZoneByIdAsync(Guid zoneId);
    Task<Zone> CreateZoneAsync(CreateZoneRequest request);
    Task<Zone> UpdateZoneAsync(Guid id, CreateZoneRequest request);
    Task<bool> DeleteZoneAsync(Guid id);
    
    Task<IEnumerable<Location>> GetLocationsByZoneAsync(Guid zoneId);
    Task<Location?> GetLocationByIdAsync(Guid locationId);
    Task<Location> CreateLocationAsync(CreateLocationRequest request);
    Task<Location> UpdateLocationAsync(Guid id, CreateLocationRequest request);
    Task<bool> DeleteLocationAsync(Guid locationId);
}