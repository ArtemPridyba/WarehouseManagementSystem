import axiosInstance from '../api/axiosInstance';
import type { Product, UpsertProductRequest } from '../types';

export const productService = {
    async getAll(): Promise<Product[]> {
        const res = await axiosInstance.get<Product[]>('/Products');
        return res.data;
    },

    async getById(id: string): Promise<Product> {
        const res = await axiosInstance.get<Product>(`/Products/${id}`);
        return res.data;
    },

    async create(data: UpsertProductRequest): Promise<Product> {
        const res = await axiosInstance.post<Product>('/Products', data);
        return res.data;
    },

    async update(id: string, data: UpsertProductRequest): Promise<Product> {
        const res = await axiosInstance.put<Product>(`/Products/${id}`, data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/Products/${id}`);
    },
};