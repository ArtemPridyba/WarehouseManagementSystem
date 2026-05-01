using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.API.Application.Interfaces;
using Warehouse.API.Infrastructure.Data;

namespace Warehouse.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ApplicationDbContext _context;

    public DashboardController(IDashboardService dashboardService, ApplicationDbContext context)
    {
        _dashboardService = dashboardService;
        _context = context;
    }

    /// <summary>
    /// Загальний зріз даних: лічильники, категорії, заповненість та алерти.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var stats = await _dashboardService.GetGeneralStatsAsync(tenant.Id);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// ABC-аналіз категорій товарів (класифікація за обсягом).
    /// </summary>
    [HttpGet("abc-analysis")]
    public async Task<IActionResult> GetAbcAnalysis()
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var data = await _dashboardService.GetAbcAnalysisAsync(tenant.Id);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Статистика використання складських потужностей за типами локацій.
    /// </summary>
    [HttpGet("utilization")]
    public async Task<IActionResult> GetUtilization()
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var data = await _dashboardService.GetLocationUtilizationAsync(tenant.Id);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Теплова карта активності складу (кількість операцій по годинах).
    /// </summary>
    [HttpGet("activity-heatmap")]
    public async Task<IActionResult> GetHeatmap()
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var data = await _dashboardService.GetHourlyHeatmapAsync(tenant.Id);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Аналіз оборотності товарів (прихід vs видатка) за вказану кількість днів.
    /// </summary>
    [HttpGet("stock-turnover")]
    public async Task<IActionResult> GetTurnover([FromQuery] int days = 30)
    {
        var tenant = await _context.Tenants.FirstAsync();
        try
        {
            var data = await _dashboardService.GetStockTurnoverAsync(tenant.Id, days);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}