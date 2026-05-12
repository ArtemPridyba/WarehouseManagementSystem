export type WorkOrderType = 'Receive' | 'Ship' | 'Transfer' | 'Adjust' | 'Count';
export type WorkOrderStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type WorkOrderPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
    Receive: 'Приймання',
    Ship: 'Відвантаження',
    Transfer: 'Переміщення',
    Adjust: 'Коригування',
    Count: 'Перерахунок',
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
    Pending: 'Очікує',
    InProgress: 'Виконується',
    Completed: 'Виконано',
    Cancelled: 'Скасовано',
};

export const WORK_ORDER_STATUS_COLORS: Record<WorkOrderStatus, string> = {
    Pending: '#f59e0b',
    InProgress: '#6366f1',
    Completed: '#2dd4bf',
    Cancelled: '#475569',
};

export const WORK_ORDER_PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
    Low: 'Низький',
    Normal: 'Звичайний',
    High: 'Високий',
    Urgent: 'Терміново',
};

export const WORK_ORDER_PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
    Low: '#475569',
    Normal: '#6366f1',
    High: '#f59e0b',
    Urgent: '#f87171',
};

export const WORK_ORDER_TYPE_ICONS: Record<WorkOrderType, string> = {
    Receive: '📦',
    Ship: '🚚',
    Transfer: '↔️',
    Adjust: '⚖️',
    Count: '🔢',
};

export interface WorkOrderDto {
    id: string;
    type: WorkOrderType;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    title: string;
    description?: string;
    assignedToId?: string;
    assignedToName?: string;
    createdById: string;
    createdByName?: string;
    inboundOrderId?: string;
    inboundOrderNumber?: string;
    outboundOrderId?: string;
    outboundOrderNumber?: string;
    productId?: string;
    productName?: string;
    fromLocationId?: string;
    fromLocationCode?: string;
    toLocationId?: string;
    toLocationCode?: string;
    quantity?: number;
    dueDate?: string;
    completedAt?: string;
    completionNote?: string;
    createdAt: string;
}

export interface CreateWorkOrderRequest {
    type: WorkOrderType;
    title: string;
    description?: string;
    priority: WorkOrderPriority;
    assignedToId?: string;
    inboundOrderId?: string;
    outboundOrderId?: string;
    productId?: string;
    fromLocationId?: string;
    toLocationId?: string;
    quantity?: number;
    dueDate?: string;
}

export interface UpdateWorkOrderStatusRequest {
    status: WorkOrderStatus;
    completionNote?: string;
}

export interface AssignWorkOrderRequest {
    assignedToId: string;
}