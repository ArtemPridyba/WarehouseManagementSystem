using Warehouse.API.Application.DTOs.Common;
using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.DTOs.Inventory;

public record GetTransactionsQuery : PagedQuery
{
    public Guid? WarehouseId { get; init; }
    public TransactionType? Type { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
}