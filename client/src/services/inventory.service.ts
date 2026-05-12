import axiosInstance from '../api/axiosInstance';
import type { StockItem, ProductLocationItem, TransferRequest, AdjustmentRequest } from '../types';

export const inventoryService = {
    async getStock(warehouseId: string): Promise<StockItem[]> {
        const res = await axiosInstance.get<StockItem[]>(`/Inventory/stock/${warehouseId}`);
        return res.data;
    },

    async getProductLocations(productId: string): Promise<ProductLocationItem[]> {
        const res = await axiosInstance.get<ProductLocationItem[]>(`/Inventory/product-locations/${productId}`);
        return res.data;
    },

    async transfer(data: TransferRequest): Promise<void> {
        await axiosInstance.post('/Inventory/transfer', data);
    },

    async adjust(data: AdjustmentRequest): Promise<void> {
        await axiosInstance.post('/Inventory/adjust', data);
    },
};