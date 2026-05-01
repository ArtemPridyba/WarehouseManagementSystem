using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.MasterData;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Entities;
using Warehouse.API.Infrastructure.Data;
using WarehouseEntity = Warehouse.API.Domain.Entities.Warehouse;

namespace Warehouse.API.Application.Services;

public class StructureService : IStructureService
{
    private readonly ApplicationDbContext _context;
    public StructureService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<Warehouse.API.Domain.Entities.Warehouse>> GetWarehousesAsync(Guid tenantId) =>
        await _context.Warehouses.Where(w => w.TenantId == tenantId).ToListAsync();

    public async Task<Warehouse.API.Domain.Entities.Warehouse> CreateWarehouseAsync(Guid tenantId, CreateWarehouseRequest request)
    {
        var warehouse = new Warehouse.API.Domain.Entities.Warehouse 
        { 
            TenantId = tenantId, 
            Name = request.Name, 
            Address = request.Address 
        };
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();
        return warehouse;
    }
    
    public async Task<WarehouseEntity> UpdateWarehouseAsync(Guid tenantId, Guid id, CreateWarehouseRequest request)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
        if (warehouse == null) throw new Exception("Склад не знайдено");

        warehouse.Name = request.Name;
        warehouse.Address = request.Address;
        await _context.SaveChangesAsync();
        return warehouse;
    }

    public async Task<bool> DeleteWarehouseAsync(Guid tenantId, Guid id)
    {
        var warehouse = await _context.Warehouses.Include(w => w.Zones).FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
        if (warehouse == null) return false;

        if (warehouse.Zones.Any()) throw new Exception("Неможливо видалити склад, у якому є зони");

        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<WarehouseEntity?> GetWarehouseByIdAsync(Guid tenantId, Guid warehouseId)
    {
        return await _context.Warehouses
            .Where(w => w.TenantId == tenantId && w.Id == warehouseId)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Zone>> GetZonesAsync(Guid tenantId, Guid warehouseId)
    {
        return await _context.Zones
            .Where(z => z.TenantId == tenantId && z.WarehouseId == warehouseId)
            .ToListAsync();
    }

    public async Task<Zone> CreateZoneAsync(Guid tenantId, CreateZoneRequest request)
    {
        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == request.WarehouseId && w.TenantId == tenantId);
        if (!warehouseExists) throw new Exception("Склад не знайдено");

        var zone = new Zone { TenantId = tenantId, WarehouseId = request.WarehouseId, Name = request.Name };
        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();
        return zone;
    }
    
    public async Task<Zone?> GetZoneByIdAsync(Guid tenantId, Guid zoneId)
    {
        return await _context.Zones
            .Where(z => z.TenantId == tenantId && z.Id == zoneId)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }

    public async Task<Zone> UpdateZoneAsync(Guid tenantId, Guid id, CreateZoneRequest request)
    {
        var zone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id && z.TenantId == tenantId);
        if (zone == null) throw new Exception("Зону не знайдено");

        zone.Name = request.Name;
        await _context.SaveChangesAsync();
        return zone;
    }

    public async Task<bool> DeleteZoneAsync(Guid tenantId, Guid id)
    {
        var zone = await _context.Zones.Include(z => z.Locations).FirstOrDefaultAsync(z => z.Id == id && z.TenantId == tenantId);
        if (zone == null) return false;

        if (zone.Locations.Any()) throw new Exception("Неможливо видалити зону, в якій є локації");

        _context.Zones.Remove(zone);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Location>> GetLocationsByZoneAsync(Guid tenantId, Guid zoneId) =>
        await _context.Locations.Where(l => l.TenantId == tenantId && l.ZoneId == zoneId).ToListAsync();

    public async Task<Location> CreateLocationAsync(Guid tenantId, CreateLocationRequest request)
    {
        var zoneExists = await _context.Zones.AnyAsync(z => z.Id == request.ZoneId && z.TenantId == tenantId);
        if (!zoneExists) throw new Exception("Зону не знайдено");

        if (await _context.Locations.AnyAsync(l => l.TenantId == tenantId && l.Code == request.Code))
            throw new Exception("Локація з таким кодом вже існує");

        var location = new Location { TenantId = tenantId, ZoneId = request.ZoneId, Code = request.Code, Type = request.Type };
        _context.Locations.Add(location);
        await _context.SaveChangesAsync();
        return location;
    }
    
    public async Task<Location?> GetLocationByIdAsync(Guid tenantId, Guid locationId)
    {
        return await _context.Locations
            .Where(l => l.TenantId == tenantId && l.Id == locationId)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }
    
    public async Task<Location> UpdateLocationAsync(Guid tenantId, Guid id, CreateLocationRequest request)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        if (location == null) throw new Exception("Локацію не знайдено");
        
        if (location.Code != request.Code && await _context.Locations.AnyAsync(l => l.TenantId == tenantId && l.Code == request.Code))
            throw new Exception("Локація з таким кодом вже існує");

        location.Code = request.Code;
        location.Type = request.Type;
        await _context.SaveChangesAsync();
        return location;
    }

    public async Task<bool> DeleteLocationAsync(Guid tenantId, Guid locationId)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == locationId && l.TenantId == tenantId);
        if (location == null) return false;
        
        var hasStock = await _context.InventoryBalances.AnyAsync(b => b.LocationId == locationId);
        if (hasStock) throw new Exception("Неможливо видалити локацію, в якій є товар");

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
        return true;
    }
}