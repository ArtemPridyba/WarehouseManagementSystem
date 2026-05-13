export type TransactionType = 'Inbound' | 'Outbound' | 'Transfer' | 'Adjustment';

export interface InventoryTransactionItem {
    id: string;
    productName: string;
    sku: string;
    type: TransactionType;
    quantity: number;
    fromLocation: string | null;
    fromZone: string | null;
    toLocation: string | null;
    toZone: string | null;
    batchNumber: string | null;
    reference: string | null;
    createdAt: string;
}