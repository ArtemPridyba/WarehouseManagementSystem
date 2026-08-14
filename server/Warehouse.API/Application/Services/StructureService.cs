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

    public async Task<WarehouseEntity> GetWarehouseByIdAsync(Guid warehouseId)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == warehouseId);

        if (warehouse == null)
        {
            throw new KeyNotFoundException($"Склад з ID '{warehouseId}' не знайдено.");
        }
        
        return warehouse;
    }
        

    public async Task<WarehouseEntity> CreateWarehouseAsync(CreateWarehouseRequest request)
    {
        var nameConflict = await _context.Warehouses.AnyAsync(w => w.Name == request.Name);
        if (nameConflict)
        {
            throw new InvalidOperationException($"Склад з назвою '{request.Name}' вже існує.");
        }
        
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
        if (warehouse == null)
        {
            throw new KeyNotFoundException($"Склад з ID '{id}' не знайдено.");
        }

        var nameConflict = 
            await _context.Warehouses.AnyAsync(w => w.Name == request.Name && w.Address == request.Address);

        if (nameConflict)
        {
            throw new InvalidOperationException($"Склад з назвою '{request.Name}' вже існує.");
        }
        warehouse.Name = request.Name;
        warehouse.Address = request.Address;
        
        await _context.SaveChangesAsync();
        return warehouse;
    }

    public async Task DeleteWarehouseAsync(Guid id)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Zones)
            .FirstOrDefaultAsync(w => w.Id == id);
        if (warehouse == null)
        {
            throw new KeyNotFoundException($"Склад з ID '{id}' не знайдено.");
            
        }

        if (warehouse.Zones.Any())
        {
            throw new InvalidOperationException($"Неможливо видалити склав в якому є зони");
        }

        _context.Warehouses.Remove(warehouse);
        await _context.SaveChangesAsync();
    }

    // --- ZONES ---

    public async Task<IEnumerable<Zone>> GetZonesAsync(Guid warehouseId) =>
        await _context.Zones.Where(z => z.WarehouseId == warehouseId).AsNoTracking().ToListAsync();

    public async Task<Zone> GetZoneByIdAsync(Guid zoneId)
    {
       var zone = await _context.Zones.AsNoTracking().FirstOrDefaultAsync(z => z.Id == zoneId);

       if (zone == null)
       {
           throw new KeyNotFoundException($"Зону з ID: '{zoneId}' не знайдено.");
       }

       return zone;
    }
        
    public async Task<Zone> CreateZoneAsync(CreateZoneRequest request)
    {
        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == request.WarehouseId);
        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Складу з ID: '{request.WarehouseId}' не знайдено.");
        }
        
        var nameConflict = await _context.Zones.AnyAsync(z => 
            z.WarehouseId == request.WarehouseId && z.Name == request.Name);
        if (nameConflict)
        {
            throw new InvalidOperationException($"Зона з назвою '{request.Name}' вже інсує на цьому складі");
        }

        var zone = new Zone
        {
            WarehouseId = request.WarehouseId, Name = request.Name
        };
        
        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();
        return zone;
    }

    public async Task<Zone> UpdateZoneAsync(Guid id, CreateZoneRequest request)
    {
        var zone = await _context.Zones.FirstOrDefaultAsync(z => z.Id == id);
        if (zone == null)
        {
            throw new KeyNotFoundException($"Зону з ID:'{id}' не знайдено.");
        }
        
        var nameConflict = await _context.Zones.AnyAsync(z =>
            z.WarehouseId == request.WarehouseId && z.Name == request.Name && z.Id != id);

        if (nameConflict)
        {
            throw new InvalidOperationException($"Зона з назвою  '{request.Name}' вже існує на цьому складі.");
        }
        
        zone.Name = request.Name;
        await _context.SaveChangesAsync();
        return zone;
    }

    public async Task DeleteZoneAsync(Guid id)
    {
        var zone = await _context.Zones.Include(z =>
            z.Locations).FirstOrDefaultAsync(z => z.Id == id);
        if (zone == null)
        {
            throw new KeyNotFoundException($"Зони з ID: '{id}' не знайдено.");
        }

        if (zone.Locations.Any())
        {
            throw new InvalidOperationException($"Неможливо видалити зону в якій є локації.");
        }

        _context.Zones.Remove(zone);
        await _context.SaveChangesAsync();
    }

    // --- LOCATIONS ---

    public async Task<IEnumerable<Location>> GetLocationsByZoneAsync(Guid zoneId) =>
        await _context.Locations.Where(l => l.ZoneId == zoneId).AsNoTracking().ToListAsync();

    public async Task<Location?> GetLocationByIdAsync(Guid locationId)
    {
        var location = await _context.Locations.AsNoTracking().FirstOrDefaultAsync(l => l.Id == locationId);
        if (location == null)
        {
            throw new KeyNotFoundException($"Локацію з ID: '{locationId}' не знайдено.");
        }

        return location;
    }

    public async Task<Location> CreateLocationAsync(CreateLocationRequest request)
    {
        var zoneExist = await _context.Zones.AllAsync(z => z.Id == request.ZoneId);
        if (!zoneExist)
        {
            throw new KeyNotFoundException($"Зону з ID: '{request.ZoneId}' не знайдено.");
        }
        
        var codeConflict = await _context.Locations.AnyAsync(l => 
            l.ZoneId == request.ZoneId && l.Code == request.Code);
        if (codeConflict)
        {
            throw new InvalidOperationException($"Локація з кодом '{request.Code}' вже існує в цій зоні.");
        }
            
        var location = new Location
        {
            ZoneId = request.ZoneId,
            Code = request.Code,
            Type = request.LocationType 
        };
        _context.Locations.Add(location);
        await _context.SaveChangesAsync();
        return location;
    }

    public async Task<Location> UpdateLocationAsync(Guid id, CreateLocationRequest request)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == id);
        if (location == null)
        {
            throw new KeyNotFoundException($"Локацію з ID '{id}' не знайдено.");
        }
        
        var  codeConflict = await _context.Locations.AnyAsync(l => 
            l.ZoneId == request.ZoneId && l.Code == request.Code && l.Id != id);
        if (codeConflict)
        {
            throw new InvalidOperationException($"Локація з кодом '{request.Code}' вже існує в цій зоні.");
        }
        
        location.Code = request.Code;
        location.Type = request.LocationType;
        await _context.SaveChangesAsync();
        return location;
    }

    public async Task DeleteLocationAsync(Guid locationId)
    {
        var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == locationId);
        if (location == null)
        {
            throw new KeyNotFoundException($"Локацію з ID: '{locationId}' не знайдено.");
        }

        var hasStock = await _context.InventoryBalances.AnyAsync(b => b.LocationId == locationId);
        if (hasStock)
        {
            throw new InvalidOperationException("Неможливо видалити локацію, в якій є товар.");
        }

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
    }
}