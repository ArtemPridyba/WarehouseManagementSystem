import { useEffect, useState } from 'react';
import {
    ClipboardList, Plus, Loader2, X, CheckCircle,
    Clock, User, ChevronDown, ChevronRight,
    Trash2, UserCheck,
} from 'lucide-react';
import { workOrderService } from '../services/workorder.service';
import { authService } from '../services/auth.service';
import { useAuth, useRole } from '../hooks/useAuth';
import type {
    WorkOrderDto, CreateWorkOrderRequest, WorkOrderStatus,
    WorkOrderType, WorkOrderPriority, EmployeeDto,
    LocationEntity,
} from '../types';
import {
    WORK_ORDER_TYPE_LABELS, WORK_ORDER_STATUS_LABELS,
    WORK_ORDER_STATUS_COLORS, WORK_ORDER_PRIORITY_LABELS,
    WORK_ORDER_PRIORITY_COLORS, WORK_ORDER_TYPE_ICONS,
} from '../types';
import {warehouseService} from "../services/warehouse.service.ts";
import {inventoryService} from "../services/inventory.service.ts";
import {inboundService} from "../services/inbound.service.ts";
import {outboundService} from "../services/outbound.service.ts";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkOrderStatus }) {
    return (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                  background: `${WORK_ORDER_STATUS_COLORS[status]}18`,
                  color: WORK_ORDER_STATUS_COLORS[status],
                  border: `1px solid ${WORK_ORDER_STATUS_COLORS[status]}30`,
              }}>
      {WORK_ORDER_STATUS_LABELS[status]}
    </span>
    );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
    return (
        <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{
                  background: `${WORK_ORDER_PRIORITY_COLORS[priority]}15`,
                  color: WORK_ORDER_PRIORITY_COLORS[priority],
              }}>
      {WORK_ORDER_PRIORITY_LABELS[priority]}
    </span>
    );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ employees, onClose, onCreate }: {
    employees: EmployeeDto[];
    onClose: () => void;
    onCreate: () => void;
}) {
    const [form, setForm] = useState<CreateWorkOrderRequest>({
        type: 'Receive',
        title: '',
        description: '',
        priority: 'Normal',
        assignedToId: '',
        dueDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const TYPES: WorkOrderType[] = ['Receive', 'Ship', 'Transfer', 'Adjust', 'Count'];
    const PRIORITIES: WorkOrderPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

    const isValid = form.title.trim().length >= 3;

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await workOrderService.create({
                ...form,
                assignedToId: form.assignedToId || undefined,
                dueDate: form.dueDate || undefined,
                description: form.description || undefined,
            });
            onCreate();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка створення');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Нове завдання
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Тип */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Тип завдання *
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {TYPES.map(type => {
                                const colors: Record<WorkOrderType, string> = {
                                    Receive: '#2dd4bf',
                                    Ship: '#f59e0b',
                                    Transfer: '#6366f1',
                                    Adjust: '#f87171',
                                    Count: '#a78bfa',
                                };
                                const color = colors[type];
                                const isSelected = form.type === type;
                                return (
                                    <button key={type} type="button"
                                            onClick={() => setForm(p => ({ ...p, type }))}
                                            className="py-2.5 rounded-lg text-xs font-medium transition-all text-center"
                                            style={{
                                                background: isSelected ? `${color}20` : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                                                color: isSelected ? color : '#475569',
                                            }}>
                                        {WORK_ORDER_TYPE_LABELS[type]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Заголовок */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Заголовок *
                        </label>
                        <input
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="Наприклад: Прийняти товар по замовленню INB-001"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Опис */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Опис
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Детальний опис завдання..."
                            rows={3}
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Пріоритет + Дедлайн */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Пріоритет
                            </label>
                            <select value={form.priority}
                                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as WorkOrderPriority }))}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                    style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p}>{WORK_ORDER_PRIORITY_LABELS[p]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Дедлайн
                            </label>
                            <input type="date"
                                   value={form.dueDate}
                                   onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                                   className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            />
                        </div>
                    </div>

                    {/* Призначити */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Призначити виконавця
                        </label>
                        <select value={form.assignedToId}
                                onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            <option value="">— Не призначено —</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} ({e.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{
                                background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Створити завдання
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Complete Modal ───────────────────────────────────────────────────────────

function CompleteModal({ order, onClose, onDone }: {
    order: WorkOrderDto;
    onClose: () => void;
    onDone: () => void;
}) {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Для Transfer
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [locations, setLocations] = useState<LocationEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [transferLocationId, setTransferLocationId] = useState(order.toLocationId ?? '');
    const [transferQty, setTransferQty] = useState<number>(order.quantity ?? 1);

    // Для Receive
    const [receiveLocationId, setReceiveLocationId] = useState(order.toLocationId ?? '');
    const [receiveQty, setReceiveQty] = useState<number>(order.quantity ?? 1);
    const [batchNumber, setBatchNumber] = useState('');
    const [expirationDate, setExpirationDate] = useState('');

    // Для Ship
    const [shipLocationId, setShipLocationId] = useState(order.fromLocationId ?? '');
    const [shipQty, setShipQty] = useState<number>(order.quantity ?? 1);

    const needsWarehouse = ['Transfer', 'Receive', 'Ship'].includes(order.type);

    useEffect(() => {
        if (needsWarehouse) {
            warehouseService.getAll().then(data =>
                setWarehouses(data.map(w => ({ id: w.id, name: w.name })))
            );
        }
    }, [needsWarehouse]);

    async function handleWarehouseChange(warehouseId: string) {
        setSelectedWarehouse(warehouseId);
        const zones = await warehouseService.getZones(warehouseId);
        const allLocations: LocationEntity[] = [];
        for (const zone of zones) {
            const locs = await warehouseService.getLocations(zone.id);
            allLocations.push(...locs);
        }
        setLocations(allLocations);
    }

    async function handleComplete() {
        setError(null);
        setLoading(true);
        try {
            // Виконуємо реальну операцію залежно від типу
            if (order.type === 'Transfer' && order.productId && order.fromLocationId) {
                await inventoryService.transfer({
                    productId: order.productId,
                    fromLocationId: order.fromLocationId,
                    toLocationId: transferLocationId,
                    batchId: order.quantity ? undefined : undefined,
                    quantity: transferQty,
                });
            } else if (order.type === 'Receive' && order.inboundOrderId && order.productId) {
                await inboundService.receive({
                    inboundOrderId: order.inboundOrderId,
                    productId: order.productId,
                    locationId: receiveLocationId,
                    quantity: receiveQty,
                    batchNumber: batchNumber || undefined,
                    expirationDate: expirationDate || undefined,
                });
            } else if (order.type === 'Ship' && order.outboundOrderId && order.productId) {
                await outboundService.ship({
                    outboundOrderId: order.outboundOrderId,
                    productId: order.productId,
                    locationId: shipLocationId,
                    quantity: shipQty,
                });
            }

            // Позначаємо завдання як виконане
            await workOrderService.updateStatus(order.id, {
                status: 'Completed',
                completionNote: note || undefined,
            });

            onDone();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка виконання');
        } finally {
            setLoading(false);
        }
    }

    const isValid = () => {
        if (order.type === 'Transfer') return transferLocationId && transferQty > 0;
        if (order.type === 'Receive') return receiveLocationId && receiveQty > 0;
        if (order.type === 'Ship') return shipLocationId && shipQty > 0;
        return true;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Виконати завдання
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {/* Info */}
                <div className="rounded-lg px-3 py-2.5 mb-4"
                     style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-sm font-medium" style={{ color: '#a5b4fc' }}>{order.title}</p>
                    {order.productName && (
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                            Товар: <span style={{ color: '#94a3b8' }}>{order.productName}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {/* Transfer fields */}
                    {order.type === 'Transfer' && (
                        <>
                            <div className="text-xs px-3 py-2 rounded-lg"
                                 style={{ background: 'rgba(255,255,255,0.03)', color: '#475569' }}>
                                З комірки: <span style={{ color: '#94a3b8' }}>{order.fromLocationCode ?? '—'}</span>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                    Склад *
                                </label>
                                <select value={selectedWarehouse}
                                        onChange={e => handleWarehouseChange(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                    Комірка призначення *
                                </label>
                                <select value={transferLocationId}
                                        onChange={e => setTransferLocationId(e.target.value)}
                                        disabled={!locations.length}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                    Кількість *
                                </label>
                                <input type="number" min={0.001} step={0.001}
                                       value={transferQty}
                                       onChange={e => setTransferQty(parseFloat(e.target.value))}
                                       className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                       style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                       onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                       onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </>
                    )}

                    {/* Receive fields */}
                    {order.type === 'Receive' && (
                        <>
                            {order.inboundOrderNumber && (
                                <div className="text-xs px-3 py-2 rounded-lg"
                                     style={{ background: 'rgba(255,255,255,0.03)', color: '#475569' }}>
                                    Замовлення: <span className="font-mono" style={{ color: '#94a3b8' }}>{order.inboundOrderNumber}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Склад *</label>
                                <select value={selectedWarehouse}
                                        onChange={e => handleWarehouseChange(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Комірка *</label>
                                <select value={receiveLocationId}
                                        onChange={e => setReceiveLocationId(e.target.value)}
                                        disabled={!locations.length}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Кількість *</label>
                                <input type="number" min={0.001} step={0.001}
                                       value={receiveQty}
                                       onChange={e => setReceiveQty(parseFloat(e.target.value))}
                                       className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                       style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                       onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                       onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Партія</label>
                                    <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)}
                                           placeholder="BATCH-001"
                                           className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
                                           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                           onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                           onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Термін</label>
                                    <input type="date" value={expirationDate}
                                           onChange={e => setExpirationDate(e.target.value)}
                                           className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Ship fields */}
                    {order.type === 'Ship' && (
                        <>
                            {order.outboundOrderNumber && (
                                <div className="text-xs px-3 py-2 rounded-lg"
                                     style={{ background: 'rgba(255,255,255,0.03)', color: '#475569' }}>
                                    Замовлення: <span className="font-mono" style={{ color: '#94a3b8' }}>{order.outboundOrderNumber}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Склад *</label>
                                <select value={selectedWarehouse}
                                        onChange={e => handleWarehouseChange(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Комірка списання *</label>
                                <select value={shipLocationId}
                                        onChange={e => setShipLocationId(e.target.value)}
                                        disabled={!locations.length}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Кількість *</label>
                                <input type="number" min={0.001} step={0.001}
                                       value={shipQty}
                                       onChange={e => setShipQty(parseFloat(e.target.value))}
                                       className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                       style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                       onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                       onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </>
                    )}

                    {/* Count/Adjust — просто коментар */}
                    {(order.type === 'Count' || order.type === 'Adjust') && (
                        <div className="text-sm px-3 py-2.5 rounded-lg"
                             style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                            Підтвердіть що завдання виконано фізично на складі.
                        </div>
                    )}

                    {/* Коментар */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Коментар до виконання
                        </label>
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                                  placeholder="Примітки..."
                                  rows={2}
                                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                  onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handleComplete} disabled={loading || !isValid()}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{
                                background: loading || !isValid() ? 'rgba(45,212,191,0.4)' : '#0d9488',
                                color: '#fff',
                                cursor: loading || !isValid() ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <CheckCircle size={14} />
                        Виконати
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Work Order Card ──────────────────────────────────────────────────────────

function WorkOrderCard({ order, isAdmin, currentUserId, onComplete, onDelete, onAssign, onStatusChange }: {
    order: WorkOrderDto;
    isAdmin: boolean;
    currentUserId: string;
    onComplete: () => void;
    onDelete: () => void;
    onAssign: () => void;
    onStatusChange: (status: WorkOrderStatus) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isMyTask = order.assignedToId === currentUserId;
    const canComplete = (isMyTask || isAdmin) && order.status !== 'Completed' && order.status !== 'Cancelled';
    const isOverdue = order.dueDate && new Date(order.dueDate) < new Date() && order.status !== 'Completed';

    return (
        <div className="rounded-xl overflow-hidden"
             style={{
                 border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.06)'}`,
                 background: '#13151f',
             }}>

            {/* Header */}
            <div className="px-4 py-3 cursor-pointer"
                 onClick={() => setExpanded(p => !p)}>
                <div className="flex items-center gap-3">
                    <span className="text-lg">{WORK_ORDER_TYPE_ICONS[order.type]}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                                {order.title}
                            </p>
                            {isOverdue && (
                                <span className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                  Прострочено
                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <StatusBadge status={order.status} />
                            <PriorityBadge priority={order.priority} />
                            <span className="text-xs" style={{ color: '#334155' }}>
                {WORK_ORDER_TYPE_LABELS[order.type]}
              </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Взяти в роботу */}
                        {order.status === 'Pending' && (isMyTask || isAdmin) && (
                            <button
                                onClick={() => onStatusChange('InProgress')}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                                Взяти в роботу
                            </button>
                        )}
                        {/* Завершити */}
                        {canComplete && order.status === 'InProgress' && (
                            <button
                                onClick={onComplete}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"
                                style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}>
                                <CheckCircle size={12} /> Виконано
                            </button>
                        )}
                        {/* Призначити */}
                        {isAdmin && !order.assignedToId && (
                            <button onClick={onAssign}
                                    className="p-1.5 rounded-md"
                                    style={{ color: '#475569' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                                    title="Призначити виконавця">
                                <UserCheck size={15} />
                            </button>
                        )}
                        {/* Видалити */}
                        {isAdmin && order.status !== 'Completed' && (
                            <button onClick={onDelete}
                                    className="p-1.5 rounded-md"
                                    style={{ color: '#475569' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                                    title="Видалити">
                                <Trash2 size={15} />
                            </button>
                        )}
                        <span style={{ color: '#334155' }}>
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </span>
                    </div>
                </div>
            </div>

            {/* Details */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

                    {order.description && (
                        <p className="text-sm pt-3" style={{ color: '#64748b' }}>{order.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {order.assignedToName && (
                            <div className="flex items-center gap-2">
                                <User size={13} style={{ color: '#475569' }} />
                                <div>
                                    <p className="text-xs" style={{ color: '#334155' }}>Виконавець</p>
                                    <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{order.assignedToName}</p>
                                </div>
                            </div>
                        )}
                        {order.dueDate && (
                            <div className="flex items-center gap-2">
                                <Clock size={13} style={{ color: isOverdue ? '#f87171' : '#475569' }} />
                                <div>
                                    <p className="text-xs" style={{ color: '#334155' }}>Дедлайн</p>
                                    <p className="text-xs font-medium" style={{ color: isOverdue ? '#f87171' : '#94a3b8' }}>
                                        {new Date(order.dueDate).toLocaleDateString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                        )}
                        {order.productName && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>Товар</p>
                                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{order.productName}</p>
                            </div>
                        )}
                        {order.inboundOrderNumber && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>Замовлення приходу</p>
                                <p className="text-xs font-mono font-medium" style={{ color: '#94a3b8' }}>{order.inboundOrderNumber}</p>
                            </div>
                        )}
                        {order.outboundOrderNumber && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>Замовлення відвантаження</p>
                                <p className="text-xs font-mono font-medium" style={{ color: '#94a3b8' }}>{order.outboundOrderNumber}</p>
                            </div>
                        )}
                        {order.fromLocationCode && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>З комірки</p>
                                <p className="text-xs font-mono font-medium" style={{ color: '#94a3b8' }}>{order.fromLocationCode}</p>
                            </div>
                        )}
                        {order.toLocationCode && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>До комірки</p>
                                <p className="text-xs font-mono font-medium" style={{ color: '#94a3b8' }}>{order.toLocationCode}</p>
                            </div>
                        )}
                        {order.quantity && (
                            <div>
                                <p className="text-xs" style={{ color: '#334155' }}>Кількість</p>
                                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{order.quantity} од.</p>
                            </div>
                        )}
                    </div>

                    {order.completionNote && (
                        <div className="rounded-lg px-3 py-2"
                             style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)' }}>
                            <p className="text-xs" style={{ color: '#334155' }}>Коментар до виконання</p>
                            <p className="text-xs mt-0.5" style={{ color: '#2dd4bf' }}>{order.completionNote}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <p className="text-xs" style={{ color: '#1e293b' }}>
                            Створив: {order.createdByName}
                        </p>
                        <p className="text-xs" style={{ color: '#1e293b' }}>
                            {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({ order, employees, onClose, onDone }: {
    order: WorkOrderDto;
    employees: EmployeeDto[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [assignedToId, setAssignedToId] = useState('');
    const [loading, setLoading] = useState(false);

    async function handle() {
        if (!assignedToId) return;
        setLoading(true);
        try {
            await workOrderService.assign(order.id, { assignedToId });
            onDone();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Призначити виконавця
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                <p className="text-sm mb-4 truncate" style={{ color: '#475569' }}>{order.title}</p>

                <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
                        style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                    <option value="">— Оберіть виконавця —</option>
                    {employees.map(e => (
                        <option key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.role})
                        </option>
                    ))}
                </select>

                <div className="flex gap-3">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handle} disabled={loading || !assignedToId}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{
                                background: loading || !assignedToId ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !assignedToId ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Призначити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrdersPage() {
    const { user } = useAuth();
    const { isAdmin } = useRole();
    const [orders, setOrders] = useState<WorkOrderDto[]>([]);
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | ''>('');
    const [showMyOnly, setShowMyOnly] = useState(!isAdmin);
    const [createModal, setCreateModal] = useState(false);
    const [completeOrder, setCompleteOrder] = useState<WorkOrderDto | null>(null);
    const [assignOrder, setAssignOrder] = useState<WorkOrderDto | null>(null);

    async function load() {
        const [o, e] = await Promise.all([
            showMyOnly
                ? workOrderService.getMyTasks()
                : workOrderService.getAll(filterStatus as WorkOrderStatus || undefined),
            isAdmin ? authService.getEmployees() : Promise.resolve([]),
        ]);
        setOrders(o);
        setEmployees(e);
    }

    useEffect(() => {
        let mounted = true;
        async function init() {
            const [o, e] = await Promise.all([
                showMyOnly
                    ? workOrderService.getMyTasks()
                    : workOrderService.getAll(filterStatus as WorkOrderStatus || undefined),
                isAdmin ? authService.getEmployees() : Promise.resolve([]),
            ]);
            if (mounted) {
                setOrders(o);
                setEmployees(e);
                setLoading(false);
            }
        }
        init();
        return () => { mounted = false; };
    }, [filterStatus, showMyOnly, isAdmin]);

    async function handleDelete(id: string) {
        await workOrderService.delete(id);
        setOrders(p => p.filter(o => o.id !== id));
    }

    async function handleStatusChange(id: string, status: WorkOrderStatus) {
        await workOrderService.updateStatus(id, { status });
        await load();
    }

    const STATUSES: { value: WorkOrderStatus | ''; label: string }[] = [
        { value: '', label: 'Всі статуси' },
        { value: 'Pending', label: 'Очікують' },
        { value: 'InProgress', label: 'В роботі' },
        { value: 'Completed', label: 'Виконані' },
        { value: 'Cancelled', label: 'Скасовані' },
    ];

    const pending = orders.filter(o => o.status === 'Pending').length;
    const inProgress = orders.filter(o => o.status === 'InProgress').length;

    return (
        <div className="space-y-6">
            {createModal && (
                <CreateModal
                    employees={employees}
                    onClose={() => setCreateModal(false)}
                    onCreate={load}
                />
            )}
            {completeOrder && (
                <CompleteModal
                    order={completeOrder}
                    onClose={() => setCompleteOrder(null)}
                    onDone={load}
                />
            )}
            {assignOrder && (
                <AssignModal
                    order={assignOrder}
                    employees={employees}
                    onClose={() => setAssignOrder(null)}
                    onDone={load}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Завдання</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>
                        {orders.length} завдань
                        {pending > 0 && <span style={{ color: '#f59e0b' }}> · {pending} очікують</span>}
                        {inProgress > 0 && <span style={{ color: '#6366f1' }}> · {inProgress} в роботі</span>}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                            style={{ background: '#6366f1', color: '#fff' }}>
                        <Plus size={16} /> Нове завдання
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex rounded-lg overflow-hidden"
                     style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                        onClick={() => setShowMyOnly(false)}
                        className="px-3 py-2 text-sm transition-all"
                        style={{
                            background: !showMyOnly ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: !showMyOnly ? '#818cf8' : '#475569',
                        }}>
                        Всі
                    </button>
                    <button
                        onClick={() => setShowMyOnly(true)}
                        className="px-3 py-2 text-sm transition-all"
                        style={{
                            background: showMyOnly ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: showMyOnly ? '#818cf8' : '#475569',
                        }}>
                        Мої завдання
                    </button>
                </div>

                {!showMyOnly && (
                    <select value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as WorkOrderStatus | '')}
                            className="rounded-lg px-3 py-2 text-sm outline-none"
                            style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}>
                        {STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <ClipboardList size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>
                        {showMyOnly ? 'Немає активних завдань' : 'Завдань ще немає'}
                    </p>
                    {isAdmin && !showMyOnly && (
                        <button onClick={() => setCreateModal(true)}
                                className="text-sm px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                            Створити перше завдання
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <WorkOrderCard
                            key={order.id}
                            order={order}
                            isAdmin={isAdmin}
                            currentUserId={user?.id ?? ''}
                            onComplete={() => setCompleteOrder(order)}
                            onDelete={() => handleDelete(order.id)}
                            onAssign={() => setAssignOrder(order)}
                            onStatusChange={status => handleStatusChange(order.id, status)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}