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