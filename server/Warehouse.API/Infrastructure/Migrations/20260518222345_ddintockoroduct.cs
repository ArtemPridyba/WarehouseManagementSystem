using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ddintockoroduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MinStock",
                table: "Products",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MinStock",
                table: "Products");
        }
    }
}
