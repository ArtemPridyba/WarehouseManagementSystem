import axiosInstance from '../api/axiosInstance';
import type {
    StockItem,
    ProductLocationItem,
    TransferRequest,
    AdjustmentRequest,
    PagedResult,
    InventoryTransactionItem,
    PagedQuery,
} from '../types';

export interface GetTransactionsQuery extends PagedQuery {
    warehouseId?: string;
    type?: string;
    from?: string;
    to?: string;
}

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

    async getTransactions(params: GetTransactionsQuery): Promise<PagedResult<InventoryTransactionItem>> {
        const res = await axiosInstance.get<PagedResult<InventoryTransactionItem>>(
            '/Inventory/transactions', { params }
        );
        return res.data;
    },
};