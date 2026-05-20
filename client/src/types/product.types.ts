import type {PagedQuery} from "./common.types.ts";

export interface ProductCategory {
    id: string;
    name: string;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    barcode?: string;
    categoryId?: string;
    category?: ProductCategory;
    isBatchTracked: boolean;
    isSerialTracked: boolean;
    tenantId: string;
    minStock: number;
}

export interface UpsertProductRequest {
    name: string;
    sku: string;
    barcode?: string;
    categoryId?: string;
    isBatchTracked: boolean;
    minStock: number;
}

export interface UpsertCategoryRequest {
    name: string;
}

export interface LowStockItem {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    minStock: number;
    deficit: number;
}

export interface GetProductsQuery extends PagedQuery {
    search?: string;
    categoryId?: string;
}