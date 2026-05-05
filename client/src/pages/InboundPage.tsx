import { useEffect, useState } from 'react';
import {
    ArrowDownToLine, Plus, Trash2, Loader2,
    X, ChevronDown, ChevronRight, PackageCheck,
} from 'lucide-react';
import { inboundService } from '../services/inbound.service';
import { productService } from '../services/product.service';
import { warehouseService } from '../services/warehouse.service';
import { useRole } from '../hooks/useAuth';
import type {
    InboundOrder, InboundOrderRequest, ReceiveProductRequest,
    Product, LocationEntity, OrderStatus,
} from '../types';
import {
    ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from '../types';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                  background: `${ORDER_STATUS_COLORS[status]}18`,
                  color: ORDER_STATUS_COLORS[status],
                  border: `1px solid ${ORDER_STATUS_COLORS[status]}30`,
              }}>
      {ORDER_STATUS_LABELS[status]}
    </span>
    );
}

// ─── Create Order Modal ───────────────────────────────────────────────────────

function CreateOrderModal({ products, onClose, onCreate }: {
    products: Product[];
    onClose: () => void;
    onCreate: (order: InboundOrder) => void;
}) {
    const [orderNumber, setOrderNumber] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function addItem() {
        setItems(p => [...p, { productId: '', quantity: 1 }]);
    }

    function removeItem(i: number) {
        setItems(p => p.filter((_, idx) => idx !== i));
    }

    function updateItem(i: number, field: 'productId' | 'quantity', value: string | number) {
        setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    }

    const isValid = orderNumber && items.every(i => i.productId && i.quantity > 0);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const req: InboundOrderRequest = { orderNumber, items };
            const created = await inboundService.create(req);
            onCreate(created);
            onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка створення');
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
                        Нове замовлення приходу
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                {/* Order number */}
                <div className="mb-4">
                    <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                        Номер замовлення *
                    </label>
                    <input
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                        placeholder="INB-2026-001"
                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                </div>

                {/* Items */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                            Товари *
                        </label>
                        <button onClick={addItem}
                                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md"
                                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                            <Plus size={12} /> Додати рядок
                        </button>
                    </div>

                    <div className="space-y-2">
                        {items.map((item, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <select
                                    value={item.productId}
                                    onChange={e => updateItem(i, 'productId', e.target.value)}
                                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                                    style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                >
                                    <option value="">— Оберіть товар —</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min={0.001}
                                    step={0.001}
                                    value={item.quantity}
                                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value))}
                                    className="w-24 rounded-lg px-3 py-2 text-sm outline-none text-right"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                />
                                {items.length > 1 && (
                                    <button onClick={() => removeItem(i)} style={{ color: '#475569' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        ))}
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
                        Створити замовлення
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Receive Modal ────────────────────────────────────────────────────────────

function ReceiveModal({ order, onClose, onReceive }: {
    order: InboundOrder;
    onClose: () => void;
    onReceive: () => void;
}) {
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [locations, setLocations] = useState<LocationEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [form, setForm] = useState<ReceiveProductRequest>({
        inboundOrderId: order.id,
        productId: order.items[0]?.productId ?? '',
        locationId: '',
        quantity: order.items[0]?.quantity ?? 1,
        batchNumber: '',
        expirationDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        warehouseService.getAll().then(data =>
            setWarehouses(data.map(w => ({ id: w.id, name: w.name })))
        );
    }, []);

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

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await inboundService.receive({
                ...form,
                batchNumber: form.batchNumber || undefined,
                expirationDate: form.expirationDate || undefined,
            });
            onReceive();
            onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка приймання');
        } finally {
            setLoading(false);
        }
    }

    const isValid = form.productId && form.locationId && form.quantity > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Прийняти товар
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                <p className="text-xs mb-4 px-3 py-2 rounded-lg"
                   style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
                    Замовлення: <span className="font-mono font-semibold">{order.orderNumber}</span>
                </p>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {/* Товар */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Товар *</label>
                        <select value={form.productId}
                                onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            {order.items.map(item => (
                                <option key={item.productId} value={item.productId}>
                                    {item.product?.name} — очікується: {item.quantity}, прийнято: {item.receivedQuantity}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Склад */}
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

                    {/* Комірка */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Комірка *</label>
                        <select value={form.locationId}
                                onChange={e => setForm(p => ({ ...p, locationId: e.target.value }))}
                                disabled={!locations.length}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            <option value="">— Оберіть комірку —</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                        </select>
                    </div>

                    {/* Кількість */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Кількість *</label>
                        <input type="number" min={0.001} step={0.001}
                               value={form.quantity}
                               onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) }))}
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Batch (якщо товар batch tracked) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Номер партії
                            </label>
                            <input value={form.batchNumber}
                                   onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))}
                                   placeholder="BATCH-001"
                                   className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
                                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                   onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                   onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Термін придатності
                            </label>
                            <input type="date"
                                   value={form.expirationDate}
                                   onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}
                                   className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            />
                        </div>
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
                                background: loading || !isValid ? 'rgba(45,212,191,0.4)' : '#0d9488',
                                color: '#fff',
                                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <PackageCheck size={15} />
                        Прийняти
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order, isAdmin, onDelete, onReceive }: {
    order: InboundOrder;
    isAdmin: boolean;
    onDelete: () => void;
    onReceive: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl overflow-hidden"
             style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Header */}
            <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                style={{ background: '#13151f' }}
                onClick={() => setExpanded(p => !p)}
            >
        <span style={{ color: '#334155' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
                <span className="text-sm font-mono font-medium flex-1" style={{ color: '#f1f5f9' }}>
          {order.orderNumber}
        </span>
                <span className="text-xs" style={{ color: '#475569' }}>
          {order.items.length} поз.
        </span>
                <StatusBadge status={order.status} />

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button
                            onClick={onReceive}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
                        >
                            <PackageCheck size={13} /> Прийняти
                        </button>
                    )}
                    {isAdmin && order.status === 'Draft' && (
                        <button onClick={onDelete} style={{ color: '#475569' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Items */}
            {expanded && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="grid text-xs px-4 py-2"
                         style={{ gridTemplateColumns: '2fr 1fr 1fr', color: '#334155' }}>
                        <span>Товар</span>
                        <span className="text-right">Очікується</span>
                        <span className="text-right">Прийнято</span>
                    </div>
                    {order.items.map(item => (
                        <div key={item.id} className="grid items-center px-4 py-2 text-sm"
                             style={{ gridTemplateColumns: '2fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ color: '#94a3b8' }}>{item.product?.name ?? '—'}</span>
                            <span className="text-right" style={{ color: '#f1f5f9' }}>{item.quantity}</span>
                            <span className="text-right" style={{
                                color: item.receivedQuantity >= item.quantity ? '#2dd4bf' : '#f59e0b'
                            }}>
                {item.receivedQuantity}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboundPage() {
    const { isAdmin } = useRole();
    const [orders, setOrders] = useState<InboundOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [receiveOrder, setReceiveOrder] = useState<InboundOrder | null>(null);

    async function load() {
        const [o, p] = await Promise.all([
            inboundService.getAll(),
            productService.getAll(),
        ]);
        setOrders(o);
        setProducts(p);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleDelete(id: string) {
        await inboundService.delete(id);
        setOrders(p => p.filter(o => o.id !== id));
    }

    return (
        <div className="space-y-6">
            {createModal && (
                <CreateOrderModal
                    products={products}
                    onClose={() => setCreateModal(false)}
                    onCreate={order => setOrders(p => [order, ...p])}
                />
            )}
            {receiveOrder && (
                <ReceiveModal
                    order={receiveOrder}
                    onClose={() => setReceiveOrder(null)}
                    onReceive={load}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Прихід товарів</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>
                        {orders.length} замовлень
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                            style={{ background: '#6366f1', color: '#fff' }}>
                        <Plus size={16} /> Нове замовлення
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <ArrowDownToLine size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>Замовлень приходу ще немає</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            isAdmin={isAdmin}
                            onDelete={() => handleDelete(order.id)}
                            onReceive={() => setReceiveOrder(order)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}