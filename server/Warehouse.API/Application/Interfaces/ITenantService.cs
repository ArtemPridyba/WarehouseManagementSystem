namespace Warehouse.API.Application.Interfaces;
using Warehouse.API.Application.DTOs.Tenant;

public interface ITenantService
{
    Task<TenantDto> GetCurrentTenantAsync();
    Task<TenantDto> UpdateTenantAsync(UpdateTenantRequest request);
}