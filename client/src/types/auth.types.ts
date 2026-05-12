export type Role = 'Admin' | 'Worker';

export interface AuthResponse {
    token: string;
    email: string;
    tenantId: string;
    fullName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface CreateEmployeeRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
}

export interface CurrentUser {
    id: string;
    email: string;
    tenantId: string;
    fullName: string;
    role: Role;
    token: string;
}

export interface ApiError {
    message: string;
}

export interface EmployeeDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
}