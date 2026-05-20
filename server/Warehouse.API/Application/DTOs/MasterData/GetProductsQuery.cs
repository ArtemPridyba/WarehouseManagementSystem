using Warehouse.API.Application.DTOs.Common;

namespace Warehouse.API.Application.DTOs.MasterData;

public record GetProductsQuery : PagedQuery
{
    public string? Search { get; init; }
    public Guid? CategoryId { get; init; }
}