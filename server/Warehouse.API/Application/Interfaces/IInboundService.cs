using Warehouse.API.Application.DTOs.Inbound;

namespace Warehouse.API.Application.Interfaces;

public interface IInboundService
{
    Task<bool> ReceiveProductAsync(ReceiveProductRequest request);
}