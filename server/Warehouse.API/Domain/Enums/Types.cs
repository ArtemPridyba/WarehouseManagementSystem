namespace Warehouse.API.Domain.Enums;

public enum LocationType { Storage, Receiving, Shipping, Picking, Damage }
public enum TransactionType { Inbound, Outbound, Transfer, Adjustment }
public enum WorkOrderType
{
    Receive,      // Прийняти товар
    Ship,         // Відвантажити товар
    Transfer,     // Перемістити товар
    Adjust,       // Інвентаризація/коригування
    Count         // Перерахунок
}