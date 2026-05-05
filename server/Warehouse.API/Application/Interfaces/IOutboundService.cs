using Warehouse.API.Application.DTOs.Outbound;

namespace Warehouse.API.Application.Interfaces;

public interface IOutboundService
{
    Task<bool> ShipProductAsync(ShipProductRequest request);
}