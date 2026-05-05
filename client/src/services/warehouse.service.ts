import axiosInstance from '../api/axiosInstance';
import type {
    WarehouseEntity,
    ZoneEntity,
    LocationEntity,
    CreateWarehouseRequest,
    CreateZoneRequest,
    CreateLocationRequest,
} from '../types';

export const warehouseService = {
    // ── Warehouses ──────────────────────────────────────────────────────────────
    async getAll(): Promise<WarehouseEntity[]> {
        const res = await axiosInstance.get<WarehouseEntity[]>('/Warehouses');
        return res.data;
    },
    async create(data: CreateWarehouseRequest): Promise<WarehouseEntity> {
        const res = await axiosInstance.post<WarehouseEntity>('/Warehouses', data);
        return res.data;
    },
    async update(id: string, data: CreateWarehouseRequest): Promise<WarehouseEntity> {
        const res = await axiosInstance.put<WarehouseEntity>(`/Warehouses/${id}`, data);
        return res.data;
    },
    async deleteWarehouse(id: string): Promise<void> {
        await axiosInstance.delete(`/Warehouses/${id}`);
    },

    // ── Zones ───────────────────────────────────────────────────────────────────
    async getZones(warehouseId: string): Promise<ZoneEntity[]> {
        const res = await axiosInstance.get<ZoneEntity[]>(`/Zones/warehouse/${warehouseId}`);
        return res.data;
    },
    async createZone(data: CreateZoneRequest): Promise<ZoneEntity> {
        const res = await axiosInstance.post<ZoneEntity>('/Zones', data);
        return res.data;
    },
    async updateZone(id: string, data: CreateZoneRequest): Promise<ZoneEntity> {
        const res = await axiosInstance.put<ZoneEntity>(`/Zones/${id}`, data);
        return res.data;
    },
    async deleteZone(id: string): Promise<void> {
        await axiosInstance.delete(`/Zones/${id}`);
    },

    // ── Locations ───────────────────────────────────────────────────────────────
    async getLocations(zoneId: string): Promise<LocationEntity[]> {
        const res = await axiosInstance.get<LocationEntity[]>(`/Locations/zone/${zoneId}`);
        return res.data;
    },
    async createLocation(data: CreateLocationRequest): Promise<LocationEntity> {
        const res = await axiosInstance.post<LocationEntity>('/Locations', data);
        return res.data;
    },
    async updateLocation(id: string, data: CreateLocationRequest): Promise<LocationEntity> {
        const res = await axiosInstance.put<LocationEntity>(`/Locations/${id}`, data);
        return res.data;
    },
    async deleteLocation(id: string): Promise<void> {
        await axiosInstance.delete(`/Locations/${id}`);
    },
};