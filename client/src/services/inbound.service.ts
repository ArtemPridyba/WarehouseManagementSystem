import axiosInstance from '../api/axiosInstance';
import type { InboundOrder, InboundOrderRequest, ReceiveProductRequest } from '../types';

export const inboundService = {
    async getAll(): Promise<InboundOrder[]> {
        const res = await axiosInstance.get<InboundOrder[]>('/InboundOrders');
        return res.data;
    },

    async getById(id: string): Promise<InboundOrder> {
        const res = await axiosInstance.get<InboundOrder>(`/InboundOrders/${id}`);
        return res.data;
    },

    async create(data: InboundOrderRequest): Promise<InboundOrder> {
        const res = await axiosInstance.post<InboundOrder>('/InboundOrders', data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/InboundOrders/${id}`);
    },

    async receive(data: ReceiveProductRequest): Promise<void> {
        await axiosInstance.post('/Inbound/receive', data);
    },
};