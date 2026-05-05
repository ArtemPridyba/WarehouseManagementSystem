using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.API.Application.Interfaces;

namespace Warehouse.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        return Ok(await _dashboardService.GetGeneralStatsAsync());
    }

    [HttpGet("abc-analysis")]
    public async Task<IActionResult> GetAbcAnalysis()
    {
        return Ok(await _dashboardService.GetAbcAnalysisAsync());
    }

    [HttpGet("utilization")]
    public async Task<IActionResult> GetUtilization()
    {
        return Ok(await _dashboardService.GetLocationUtilizationAsync());
    }

    [HttpGet("activity-heatmap")]
    public async Task<IActionResult> GetHeatmap()
    {
        return Ok(await _dashboardService.GetHourlyHeatmapAsync());
    }

    [HttpGet("stock-turnover")]
    public async Task<IActionResult> GetTurnover([FromQuery] int days = 30)
    {
        return Ok(await _dashboardService.GetStockTurnoverAsync(days));
    }
}