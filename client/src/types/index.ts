export type Role = 'Admin' | 'Worker';

export interface AuthResponse {
    token: string;
    email: string;
    tenantId: string;
    fullName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface CreateEmployeeRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
}

export interface CurrentUser {
    email: string;
    tenantId: string;
    fullName: string;
    role: Role;
    token: string;
}

export interface ApiError {
    message: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductCategory {
    id: string;
    name: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    barcode?: string;
    categoryId?: string;
    category?: ProductCategory;
    isBatchTracked: boolean;
    isSerialTracked: boolean;
    tenantId: string;
}

export interface UpsertProductRequest {
    name: string;
    sku: string;
    barcode?: string;
    categoryId?: string;
    isBatchTracked: boolean;
}

// ─── Topology ─────────────────────────────────────────────────────────────────

export type LocationType = 'Storage' | 'Receiving' | 'Shipping' | 'Picking' | 'Damage';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
    Storage: 'Зберігання',
    Receiving: 'Приймання',
    Shipping: 'Відвантаження',
    Picking: 'Комплектація',
    Damage: 'Брак',
};

export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
    Storage: '#6366f1',
    Receiving: '#2dd4bf',
    Shipping: '#f59e0b',
    Picking: '#a78bfa',
    Damage: '#f87171',
};

export interface WarehouseEntity {
    id: string;
    name: string;
    address?: string;
    zones: ZoneEntity[];
}

export interface ZoneEntity {
    id: string;
    name: string;
    warehouseId: string;
    locations: LocationEntity[];
}

export interface LocationEntity {
    id: string;
    code: string;
    zoneId: string;
    type: LocationType;
}

export interface CreateWarehouseRequest {
    name: string;
    address?: string;
}

export interface CreateZoneRequest {
    warehouseId: string;
    name: string;
}

export interface CreateLocationRequest {
    zoneId: string;
    code: string;
    type: LocationType;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface EmployeeDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'Draft' | 'InProgress' | 'Completed' | 'Cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    Draft: 'Чернетка',
    InProgress: 'В процесі',
    Completed: 'Завершено',
    Cancelled: 'Скасовано',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    Draft: '#475569',
    InProgress: '#f59e0b',
    Completed: '#2dd4bf',
    Cancelled: '#f87171',
};

export interface InboundOrderItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    receivedQuantity: number;
    inboundOrderId: string;
}

export interface InboundOrder {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    items: InboundOrderItem[];
}

export interface InboundOrderRequest {
    orderNumber: string;
    items: { productId: string; quantity: number }[];
}

export interface ReceiveProductRequest {
    inboundOrderId: string;
    productId: string;
    locationId: string;
    quantity: number;
    batchNumber?: string;
    expirationDate?: string;
}

// ─── Outbound ─────────────────────────────────────────────────────────────────

export interface OutboundOrderItem {
    id: string;
    outboundOrderId: string;
    productId: string;
    product: Product;
    quantity: number;
    shippedQuantity: number;
}

export interface OutboundOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    items: OutboundOrderItem[];
}

export interface OutboundOrderRequest {
    orderNumber: string;
    customerName: string;
    items: { productId: string; quantity: number }[];
}

export interface ShipProductRequest {
    outboundOrderId: string;
    productId: string;
    locationId: string;
    batchId?: string;
    quantity: number;
}