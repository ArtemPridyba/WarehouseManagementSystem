import axiosInstance from '../api/axiosInstance';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    CreateEmployeeRequest,
    UpdateEmployeeRequest,
    EmployeeDto,
} from '../types';

export const authService = {
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await axiosInstance.post<AuthResponse>('/Auth/login', data);
        return response.data;
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await axiosInstance.post<AuthResponse>('/Auth/register', data);
        return response.data;
    },

    // ── Employees ──────────────────────────────────────────────────────────────

    async getEmployees(): Promise<EmployeeDto[]> {
        const res = await axiosInstance.get<EmployeeDto[]>('/Auth/employees');
        return res.data;
    },

    async addEmployee(data: CreateEmployeeRequest): Promise<EmployeeDto> {
        const res = await axiosInstance.post<EmployeeDto>('/Auth/employees', data);
        return res.data;
    },

    async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<EmployeeDto> {
        const res = await axiosInstance.put<EmployeeDto>(`/Auth/employees/${id}`, data);
        return res.data;
    },

    async deleteEmployee(id: string): Promise<void> {
        await axiosInstance.delete(`/Auth/employees/${id}`);
    },

    async resetEmployeePassword(id: string, newPassword: string): Promise<void> {
        await axiosInstance.put(`/Auth/employees/${id}/reset-password`, { newPassword });
    },

    // ── Profile ────────────────────────────────────────────────────────────────

    async updateProfile(data: { firstName: string; lastName: string }): Promise<AuthResponse> {
        const res = await axiosInstance.put<AuthResponse>('/Auth/profile', data);
        return res.data;
    },

    async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
        await axiosInstance.put('/Auth/change-password', data);
    },
};