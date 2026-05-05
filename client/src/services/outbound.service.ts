import axiosInstance from '../api/axiosInstance';
import type { OutboundOrder, OutboundOrderRequest, ShipProductRequest } from '../types';

export const outboundService = {
    async getAll(): Promise<OutboundOrder[]> {
        const res = await axiosInstance.get<OutboundOrder[]>('/OutboundOrders');
        return res.data;
    },

    async create(data: OutboundOrderRequest): Promise<OutboundOrder> {
        const res = await axiosInstance.post<OutboundOrder>('/OutboundOrders', data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/OutboundOrders/${id}`);
    },

    async ship(data: ShipProductRequest): Promise<void> {
        await axiosInstance.post('/Outbound/ship', data);
    },
};