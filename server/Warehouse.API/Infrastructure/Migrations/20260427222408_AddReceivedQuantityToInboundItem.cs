using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReceivedQuantityToInboundItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ReceivedQuantity",
                table: "InboundOrderItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceivedQuantity",
                table: "InboundOrderItems");
        }
    }
}
