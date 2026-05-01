using Warehouse.API.Domain.Enums;

namespace Warehouse.API.Application.DTOs.Dashboard;

public record DashboardStatsResponse
{
    public SummaryStats Summary { get; init; } = null!;
    public List<CategoryDistributionDto> CategoryDistribution { get; init; } = new();
    public List<WarehouseOccupancyDto> WarehouseOccupancy { get; init; } = new();
    public List<OperationalTrendDto> WeeklyTrends { get; init; } = new();
    public List<ExpiryAlertDto> ExpiryAlerts { get; init; } = new();
}

public record SummaryStats(
    int TotalProducts,
    decimal TotalItemsCount,
    int PendingInboundOrders,
    int PendingOutboundOrders,
    int LowStockAlerts
);

public record CategoryDistributionDto(string CategoryName, decimal Quantity, double Percentage);

public record WarehouseOccupancyDto(
    string WarehouseName, 
    int TotalLocations, 
    int OccupiedLocations, 
    double OccupancyPercentage
);

public record OperationalTrendDto(DateTime Date, decimal InboundQty, decimal OutboundQty);

public record ExpiryAlertDto(string ProductName, string BatchNumber, DateTime ExpirationDate, int DaysRemaining);

public record AbcAnalysisDto(string CategoryName, decimal TotalQuantity, string Class);

public record LocationUtilizationDto(string LocationType, int Total, int Occupied, int Empty);

public record HourlyActivityDto(int Hour, int MoveCount);

public record StockTurnoverDto(string ProductName, decimal InboundQty, decimal OutboundQty, double TurnoverRate);