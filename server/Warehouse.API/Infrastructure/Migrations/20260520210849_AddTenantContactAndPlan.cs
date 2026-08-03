using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantContactAndPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TenantId1",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PlanExpiresAt",
                table: "Tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanName",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId1",
                table: "Users",
                column: "TenantId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId1",
                table: "Users",
                column: "TenantId1",
                principalTable: "Tenants",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId1",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PlanExpiresAt",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PlanName",
                table: "Tenants");
        }
    }
}
