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
}

export interface UpsertProductRequest {
    name: string;
    sku: string;
    barcode?: string;
    categoryId?: string;
    isBatchTracked: boolean;
}

export interface UpsertCategoryRequest {
    name: string;
}