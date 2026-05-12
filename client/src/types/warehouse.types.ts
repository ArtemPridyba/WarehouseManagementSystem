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
    locationType: LocationType;
}

export interface StockItem {
    productId: string;
    productName: string;
    sku: string;
    location: string;
    locationId: string;
    zoneName?: string;
    batch?: string;
    batchId?: string;
    expiryDate?: string;
    quantity: number;
}

export interface ProductLocationItem {
    locationCode: string;
    locationId: string;
    availableQuantity: number;
    batchNumber: string;
    expiryDate?: string;
}

export interface TransferRequest {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    batchId?: string;
    quantity: number;
}

export interface AdjustmentRequest {
    productId: string;
    locationId: string;
    batchId?: string;
    newQuantity: number;
    reason: string;
}

export interface LocationWithZone extends LocationEntity {
    zoneName: string;
}