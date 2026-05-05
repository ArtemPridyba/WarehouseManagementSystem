import axiosInstance from '../api/axiosInstance';
import type { ProductCategory, UpsertCategoryRequest } from '../types';

export const categoryService = {
    async getAll(): Promise<ProductCategory[]> {
        const res = await axiosInstance.get<ProductCategory[]>('/ProductCategories');
        return res.data;
    },

    async create(data: UpsertCategoryRequest): Promise<ProductCategory> {
        const res = await axiosInstance.post<ProductCategory>('/ProductCategories', data);
        return res.data;
    },

    async update(id: string, data: UpsertCategoryRequest): Promise<ProductCategory> {
        const res = await axiosInstance.put<ProductCategory>(`/ProductCategories/${id}`, data);
        return res.data;
    },

    async delete(id: string): Promise<void> {
        await axiosInstance.delete(`/ProductCategories/${id}`);
    },
};