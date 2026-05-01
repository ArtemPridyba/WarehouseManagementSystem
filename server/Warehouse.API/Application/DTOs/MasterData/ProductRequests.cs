using System.ComponentModel.DataAnnotations;

namespace Warehouse.API.Application.DTOs.MasterData;

public record UpsertProductRequest
{
    [Required(ErrorMessage = "Назва товару є обов'язковою")]
    [StringLength(200, MinimumLength = 3)]
    public string Name { get; init; } = null!;

    [Required(ErrorMessage = "Артикул (SKU) є обов'язковим")]
    [StringLength(50)]
    public string SKU { get; init; } = null!;

    [StringLength(100)]
    public string? Barcode { get; init; }

    public Guid? CategoryId { get; init; }

    public bool IsBatchTracked { get; init; }
}

public record UpsertCategoryRequest
{
    [Required(ErrorMessage = "Назва категорії є обов'язковою")]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = null!;
}