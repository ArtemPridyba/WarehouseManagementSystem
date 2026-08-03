import axiosInstance from '../api/axiosInstance';
import type {
    WorkOrderDto,
    CreateWorkOrderRequest,
    UpdateWorkOrderStatusRequest,
    AssignWorkOrderRequest,
    WorkOrderStatus, NotificationsDto, GetWorkOrdersQuery, PagedResult,
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

    // Взяти вільне завдання собі
    async take(id: string): Promise<WorkOrderDto> {
        const res = await axiosInstance.patch<WorkOrderDto>(`/WorkOrders/${id}/take`);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/WorkOrders/${id}`);
    },

    async getNotifications(): Promise<NotificationsDto> {
        const res = await axiosInstance.get<NotificationsDto>('/WorkOrders/notifications');
        return res.data;
    },

    async getPaged(params: GetWorkOrdersQuery): Promise<PagedResult<WorkOrderDto>> {
        const res = await axiosInstance.get<PagedResult<WorkOrderDto>>(
            '/WorkOrders/paged',
            {
                params: {
                    page:     params.page,
                    pageSize: params.pageSize,
                    ...(params.status   ? { status:   params.status } : {}),
                    ...(params.myOnly   ? { myOnly:   true }          : {}),
                    ...(params.freeOnly ? { freeOnly: true }          : {}),
                },
            }
        );
        return res.data;
    },
};