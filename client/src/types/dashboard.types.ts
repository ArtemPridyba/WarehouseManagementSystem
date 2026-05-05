export interface SummaryStats {
    totalProducts: number;
    totalItemsCount: number;
    pendingInboundOrders: number;
    pendingOutboundOrders: number;
    lowStockAlerts: number;
}

export interface CategoryDistributionDto {
    categoryName: string;
    quantity: number;
    percentage: number;
}

export interface WarehouseOccupancyDto {
    warehouseName: string;
    totalLocations: number;
    occupiedLocations: number;
    occupancyPercentage: number;
}

export interface ExpiryAlertDto {
    productName: string;
    batchNumber: string;
    expirationDate: string;
    daysRemaining: number;
}

export interface DashboardStatsResponse {
    summary: SummaryStats;
    categoryDistribution: CategoryDistributionDto[];
    warehouseOccupancy: WarehouseOccupancyDto[];
    expiryAlerts: ExpiryAlertDto[];
}

export interface AbcAnalysisDto {
    categoryName: string;
    totalQuantity: number;
    class: 'A' | 'B' | 'C';
}

export interface LocationUtilizationDto {
    locationType: string;
    total: number;
    occupied: number;
    empty: number;
}

export interface HourlyActivityDto {
    hour: number;
    moveCount: number;
}