namespace Warehouse.API.Domain.Enums;

public enum OrderStatus { Draft, InProgress, Completed, Cancelled }

public enum WorkOrderStatus
{
    Pending,      // Очікує виконання
    InProgress,   // Виконується
    Completed,    // Виконано
    Cancelled     // Скасовано
}