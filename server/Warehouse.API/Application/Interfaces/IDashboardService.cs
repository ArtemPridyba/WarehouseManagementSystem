using Warehouse.API.Application.DTOs.Dashboard;

namespace Warehouse.API.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsResponse> GetGeneralStatsAsync();
    Task<IEnumerable<AbcAnalysisDto>> GetAbcAnalysisAsync();
    Task<IEnumerable<StockTurnoverDto>> GetStockTurnoverAsync(int days);
    Task<IEnumerable<LocationUtilizationDto>> GetLocationUtilizationAsync();
    Task<IEnumerable<HourlyActivityDto>> GetHourlyHeatmapAsync();
}