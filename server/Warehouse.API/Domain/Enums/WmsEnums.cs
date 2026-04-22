namespace Warehouse.API.Domain.Enums;

public enum LocationType { Storage, Receiving, Shipping, Picking, Damage }
public enum OrderStatus { Draft, InProgress, Completed, Cancelled }
public enum TransactionType { Inbound, Outbound, Transfer, Adjustment }