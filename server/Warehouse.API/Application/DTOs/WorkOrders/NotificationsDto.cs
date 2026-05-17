namespace Warehouse.API.Application.DTOs.WorkOrders;

public record NotificationsDto
{
    public int TotalCount { get; init; }
    public IReadOnlyList<NotificationItem> Items { get; init; } = [];
}

public record NotificationItem
{
    public Guid Id { get; init; }
    public string Title { get; init; } = "";
    public string Type { get; init; } = "";
    public string Priority { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public bool IsUrgent { get; init; }
}