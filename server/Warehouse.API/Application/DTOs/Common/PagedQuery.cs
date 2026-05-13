namespace Warehouse.API.Application.DTOs.Common;

public abstract record PagedQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}