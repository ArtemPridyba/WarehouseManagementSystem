import axiosInstance from '../api/axiosInstance';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    CreateEmployeeRequest, EmployeeDto,
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

    async addEmployee(data: CreateEmployeeRequest): Promise<void> {
        await axiosInstance.post('/Auth/add-employee', data);
    },

    async getEmployees(): Promise<EmployeeDto[]> {
        const res = await axiosInstance.get<EmployeeDto[]>('/Auth/employees');
        return res.data;
    },
};