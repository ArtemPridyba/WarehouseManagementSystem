namespace Warehouse.API.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.DTOs.Tenant;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Domain.Enums;
using Warehouse.API.Infrastructure.Data;

public class TenantService(
    ApplicationDbContext  db,
    ICurrentUserContext   currentUser) : ITenantService
{
    private Guid TenantId => currentUser.TenantId
        ?? throw new UnauthorizedAccessException("Tenant context is missing.");

    private async Task<TenantDto> BuildDtoAsync(Domain.Entities.Tenant t)
    {
        var tid = t.Id;

        var warehouseCount = await db.Warehouses.CountAsync();
        var userCount      = await db.Users.CountAsync(u => u.TenantId == tid);
        var productCount   = await db.Products.CountAsync();
        var txCount        = await db.InventoryTransactions.CountAsync();

        var activeInbound = await db.InboundOrders.CountAsync(o =>
            o.Status != OrderStatus.Completed &&
            o.Status != OrderStatus.Cancelled);

        var activeOutbound = await db.OutboundOrders.CountAsync(o =>
            o.Status != OrderStatus.Completed &&
            o.Status != OrderStatus.Cancelled);

        return new TenantDto(
            t.Id, t.Name, t.Email, t.Phone, t.Address,
            t.CreatedAt, t.PlanName, t.PlanExpiresAt,
            warehouseCount, userCount, productCount,
            txCount, activeInbound, activeOutbound);
    }

    public async Task<TenantDto> GetCurrentTenantAsync()
    {
        var tenant = await db.Tenants.FindAsync(TenantId)
            ?? throw new KeyNotFoundException("Tenant not found.");

        return await BuildDtoAsync(tenant);
    }

    public async Task<TenantDto> UpdateTenantAsync(UpdateTenantRequest request)
    {
        var tenant = await db.Tenants.FindAsync(TenantId)
            ?? throw new KeyNotFoundException("Tenant not found.");

        tenant.Name      = request.Name;
        tenant.Email     = request.Email;
        tenant.Phone     = request.Phone;
        tenant.Address   = request.Address;
        tenant.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return await BuildDtoAsync(tenant);
    }
}