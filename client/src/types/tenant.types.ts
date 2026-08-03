export interface TenantDto {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    planName: string;
    planExpiresAt: string | null;
    warehouseCount: number;
    userCount: number;
    productCount: number;
    transactionCount: number;
    activeInboundOrders: number;
    activeOutboundOrders: number;
}

export interface UpdateTenantRequest {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}