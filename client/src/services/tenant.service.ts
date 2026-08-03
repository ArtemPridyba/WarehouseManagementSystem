import axiosInstance from '../api/axiosInstance';
import type { TenantDto, UpdateTenantRequest } from '../types';

export const tenantService = {
    get: () =>
        axiosInstance.get<TenantDto>('/Tenant').then(r => r.data),

    update: (data: UpdateTenantRequest) =>
        axiosInstance.put<TenantDto>('/Tenant', data).then(r => r.data),
};