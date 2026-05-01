using Warehouse.API.Application.DTOs.Dashboard;

namespace Warehouse.API.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsResponse> GetGeneralStatsAsync(Guid tenantId);
    Task<IEnumerable<AbcAnalysisDto>> GetAbcAnalysisAsync(Guid tenantId);
    Task<IEnumerable<StockTurnoverDto>> GetStockTurnoverAsync(Guid tenantId, int days);
    Task<IEnumerable<LocationUtilizationDto>> GetLocationUtilizationAsync(Guid tenantId);
    Task<IEnumerable<HourlyActivityDto>> GetHourlyHeatmapAsync(Guid tenantId);
}