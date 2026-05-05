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

    // --- WAREHOUSES ---

    public async Task<IEnumerable<WarehouseEntity>> GetWarehousesAsync() =>
        await _context.Warehouses.AsNoTracking().ToListAsync();

    public async Task<WarehouseEntity?> GetWarehouseByIdAsync(Guid warehouseId) =>
        await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == warehouseId);

    public async Task<WarehouseEntity> CreateWarehouseAsync(CreateWarehouseRequest request)
    {
        var warehouse = new WarehouseEntity 
        { 
            Name = request.Name, 
            Address = request.Address 
        };
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();
        return warehouse;
    }
    
    public async Task<WarehouseEntity> UpdateWarehouseAsync(Guid id, CreateWarehouseRequest request)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == id);
        if (warehouse == null) throw new Exception("Склад не знайдено");

        warehouse.Name = request.Name;
        warehouse.Address = request.Address;
        await _context.SaveChangesAsync();
        return warehouse;
    }

    public async Task<bool> DeleteWarehouseAsync(Guid id)
    {
        var warehouse = await _context.Warehouses.Include(w => w.Zones).FirstOrDefaultAsync(w => w.Id == id);
        if (warehouse == null) return false;

        if (warehouse.Zones.Any()) throw new Exception("Неможливо видалити склад, у якому є зони");

        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync();
        return true;
    }

    // --- ZONES ---

    public async Task<IEnumerable<Zone>> GetZonesAsync(Guid warehouseId) =>
        await _context.Zones.Where(z => z.WarehouseId == warehouseId).ToListAsync();

    public async Task<Zone?> GetZoneByIdAsync(Guid zoneId) =>
        await _context.Zones.AsNoTracking().FirstOrDefaultAsync(z => z.Id == zoneId);

    public async Task<Zone> CreateZoneAsync(CreateZoneRequest request)
    {
        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == request.WarehouseId);
        if (!warehouseExists) throw new Exception("Склад не знайдено");

        var zone = new Zone { WarehouseId = request.WarehouseId, Name = request.Name };
        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();
        return zone;
    }

    public async Task<Zone> UpdateZoneAsync(Guid id, CreateZoneRequest request)
    {
        var zone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id);
        if (zone == null) throw new Exception("Зону не знайдено");

        zone.Name = request.Name;
        await _context.SaveChangesAsync();
        return zone;
    }

    public async Task<bool> DeleteZoneAsync(Guid id)
    {
        var zone = await _context.Zones.Include(z => z.Locations).FirstOrDefaultAsync(z => z.Id == id);
        if (zone == null) return false;

        if (zone.Locations.Any()) throw new Exception("Неможливо видалити зону, в якій є локації");

        _context.Zones.Remove(zone);
        await _context.SaveChangesAsync();
        return true;
    }

    // --- LOCATIONS ---

    public async Task<IEnumerable<Location>> GetLocationsByZoneAsync(Guid zoneId) =>
        await _context.Locations.Where(l => l.ZoneId == zoneId).ToListAsync();

    public async Task<Location?> GetLocationByIdAsync(Guid locationId) =>
        await _context.Locations.AsNoTracking().FirstOrDefaultAsync(l => l.Id == locationId);

    public async Task<Location> CreateLocationAsync(CreateLocationRequest request)
    {
        var zoneExists = await _context.Zones.AnyAsync(z => z.Id == request.ZoneId);
        if (!zoneExists) throw new Exception("Зону не знайдено");

        if (await _context.Locations.AnyAsync(l => l.Code == request.Code))
            throw new Exception("Локація з таким кодом вже існує");

        var location = new Location { ZoneId = request.ZoneId, Code = request.Code, Type = request.Type };
        _context.Locations.Add(location);
        await _context.SaveChangesAsync();
        return location;
    }
    
    public async Task<Location> UpdateLocationAsync(Guid id, CreateLocationRequest request)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id);
        if (location == null) throw new Exception("Локацію не знайдено");
        
        if (location.Code != request.Code && await _context.Locations.AnyAsync(l => l.Code == request.Code))
            throw new Exception("Локація з таким кодом вже існує");

        location.Code = request.Code;
        location.Type = request.Type;
        await _context.SaveChangesAsync();
        return location;
    }

    public async Task<bool> DeleteLocationAsync(Guid locationId)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == locationId);
        if (location == null) return false;
        
        var hasStock = await _context.InventoryBalances.AnyAsync(b => b.LocationId == locationId);
        if (hasStock) throw new Exception("Неможливо видалити локацію, в якій є товар");

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
        return true;
    }
}