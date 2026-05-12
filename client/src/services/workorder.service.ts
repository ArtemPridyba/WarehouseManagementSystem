import axiosInstance from '../api/axiosInstance';
import type {
    WorkOrderDto,
    CreateWorkOrderRequest,
    UpdateWorkOrderStatusRequest,
    AssignWorkOrderRequest,
    WorkOrderStatus,
} from '../types';

export const workOrderService = {
    async getAll(status?: WorkOrderStatus): Promise<WorkOrderDto[]> {
        const params = status ? { status } : {};
        const res = await axiosInstance.get<WorkOrderDto[]>('/WorkOrders', { params });
        return res.data;
    },

    async getMyTasks(): Promise<WorkOrderDto[]> {
        const res = await axiosInstance.get<WorkOrderDto[]>('/WorkOrders/my');
        return res.data;
    },

    async create(data: CreateWorkOrderRequest): Promise<WorkOrderDto> {
        const res = await axiosInstance.post<WorkOrderDto>('/WorkOrders', data);
        return res.data;
    },

    async updateStatus(id: string, data: UpdateWorkOrderStatusRequest): Promise<WorkOrderDto> {
        const res = await axiosInstance.patch<WorkOrderDto>(`/WorkOrders/${id}/status`, data);
        return res.data;
    },

    async assign(id: string, data: AssignWorkOrderRequest): Promise<WorkOrderDto> {
        const res = await axiosInstance.patch<WorkOrderDto>(`/WorkOrders/${id}/assign`, data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/WorkOrders/${id}`);
    },
};