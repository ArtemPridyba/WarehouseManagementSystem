using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.DTOs.MasterData;

public record CreateWarehouseRequest(string Name, string? Address);
public record CreateZoneRequest(Guid WarehouseId, string Name);
public record CreateLocationRequest(Guid ZoneId, string Code, LocationType Type);