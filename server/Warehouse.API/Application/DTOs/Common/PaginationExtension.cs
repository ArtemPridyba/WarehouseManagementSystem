using Microsoft.EntityFrameworkCore;

namespace Warehouse.API.Application.DTOs.Common;

public static class PaginationExtension
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T, TQuery>(
        this IQueryable<T> query,
        TQuery paged,
        CancellationToken ct = default)
        where TQuery : PagedQuery
    {
        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((paged.Page - 1) * paged.PageSize)
            .Take(paged.PageSize)
            .ToListAsync(ct);

        return new PagedResult<T>
        {
            Items      = items,
            Page       = paged.Page,
            PageSize   = paged.PageSize,
            TotalCount = total,
        };
    }
}