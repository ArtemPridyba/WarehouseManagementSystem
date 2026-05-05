import type { Product } from './product.types';

export type OrderStatus = 'Draft' | 'InProgress' | 'Completed' | 'Cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    Draft: 'Чернетка',
    InProgress: 'В процесі',
    Completed: 'Завершено',
    Cancelled: 'Скасовано',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    Draft: '#475569',
    InProgress: '#f59e0b',
    Completed: '#2dd4bf',
    Cancelled: '#f87171',
};

export interface InboundOrderItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    receivedQuantity: number;
    inboundOrderId: string;
}

export interface InboundOrder {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    items: InboundOrderItem[];
}

export interface InboundOrderRequest {
    orderNumber: string;
    items: { productId: string; quantity: number }[];
}

export interface ReceiveProductRequest {
    inboundOrderId: string;
    productId: string;
    locationId: string;
    quantity: number;
    batchNumber?: string;
    expirationDate?: string;
}

export interface OutboundOrderItem {
    id: string;
    outboundOrderId: string;
    productId: string;
    product: Product;
    quantity: number;
    shippedQuantity: number;
}

export interface OutboundOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    items: OutboundOrderItem[];
}

export interface OutboundOrderRequest {
    orderNumber: string;
    customerName: string;
    items: { productId: string; quantity: number }[];
}

export interface ShipProductRequest {
    outboundOrderId: string;
    productId: string;
    locationId: string;
    batchId?: string;
    quantity: number;
}