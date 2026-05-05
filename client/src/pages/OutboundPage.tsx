import { useEffect, useState } from 'react';
import {
    ArrowUpFromLine, Plus, Trash2, Loader2,
    X, ChevronDown, ChevronRight, SendHorizontal,
} from 'lucide-react';
import { outboundService } from '../services/outbound.service';
import { productService } from '../services/product.service';
import { warehouseService } from '../services/warehouse.service';
import { useRole } from '../hooks/useAuth';
import type {
    OutboundOrder, OutboundOrderRequest, ShipProductRequest,
    Product, LocationEntity, OrderStatus,
} from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types';

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
    onCreate: (order: OutboundOrder) => void;
}) {
    const [orderNumber, setOrderNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
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

    const isValid = orderNumber && customerName && items.every(i => i.productId && i.quantity > 0);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const req: OutboundOrderRequest = { orderNumber, customerName, items };
            const created = await outboundService.create(req);
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
                        Нове замовлення відвантаження
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4 mb-4">
                    {/* Номер */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Номер замовлення *
                        </label>
                        <input
                            value={orderNumber}
                            onChange={e => setOrderNumber(e.target.value)}
                            placeholder="OUT-2026-001"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Клієнт */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Клієнт *
                        </label>
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="ТОВ Ромашка"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>
                </div>

                {/* Items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Товари *</label>
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
                                    style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                                    <option value="">— Оберіть товар —</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                                <input
                                    type="number" min={0.001} step={0.001}
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

// ─── Ship Modal ───────────────────────────────────────────────────────────────

function ShipModal({ order, onClose, onShip }: {
    order: OutboundOrder;
    onClose: () => void;
    onShip: () => void;
}) {
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [locations, setLocations] = useState<LocationEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [form, setForm] = useState<ShipProductRequest>({
        outboundOrderId: order.id,
        productId: order.items[0]?.productId ?? '',
        locationId: '',
        quantity: order.items[0]?.quantity ?? 1,
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
            await outboundService.ship(form);
            onShip();
            onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка відвантаження');
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
                        Відвантажити товар
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                <div className="flex gap-3 mb-4 px-3 py-2 rounded-lg"
                     style={{ background: 'rgba(99,102,241,0.08)' }}>
                    <div>
                        <p className="text-xs" style={{ color: '#475569' }}>Замовлення</p>
                        <p className="text-sm font-mono font-semibold" style={{ color: '#818cf8' }}>
                            {order.orderNumber}
                        </p>
                    </div>
                    <div className="ml-4">
                        <p className="text-xs" style={{ color: '#475569' }}>Клієнт</p>
                        <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                            {order.customerName}
                        </p>
                    </div>
                </div>

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
                                    {item.product?.name} — потрібно: {item.quantity}, відвантажено: {item.shippedQuantity}
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
                                background: loading || !isValid ? 'rgba(245,158,11,0.4)' : '#d97706',
                                color: '#fff',
                                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <SendHorizontal size={15} />
                        Відвантажити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order, isAdmin, onDelete, onShip }: {
    order: OutboundOrder;
    isAdmin: boolean;
    onDelete: () => void;
    onShip: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl overflow-hidden"
             style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

            <div className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                 style={{ background: '#13151f' }}
                 onClick={() => setExpanded(p => !p)}>
        <span style={{ color: '#334155' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
                <div className="flex-1 min-w-0">
          <span className="text-sm font-mono font-medium" style={{ color: '#f1f5f9' }}>
            {order.orderNumber}
          </span>
                    <span className="text-xs ml-3" style={{ color: '#475569' }}>
            {order.customerName}
          </span>
                </div>
                <span className="text-xs" style={{ color: '#475569' }}>
          {order.items.length} поз.
        </span>
                <StatusBadge status={order.status} />

                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button onClick={onShip}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <SendHorizontal size={13} /> Відвантажити
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

            {expanded && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="grid text-xs px-4 py-2"
                         style={{ gridTemplateColumns: '2fr 1fr 1fr', color: '#334155' }}>
                        <span>Товар</span>
                        <span className="text-right">Потрібно</span>
                        <span className="text-right">Відвантажено</span>
                    </div>
                    {order.items.map(item => (
                        <div key={item.id} className="grid items-center px-4 py-2 text-sm"
                             style={{ gridTemplateColumns: '2fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ color: '#94a3b8' }}>{item.product?.name ?? '—'}</span>
                            <span className="text-right" style={{ color: '#f1f5f9' }}>{item.quantity}</span>
                            <span className="text-right" style={{
                                color: item.shippedQuantity >= item.quantity ? '#2dd4bf' : '#f59e0b'
                            }}>
                {item.shippedQuantity}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundPage() {
    const { isAdmin } = useRole();
    const [orders, setOrders] = useState<OutboundOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [shipOrder, setShipOrder] = useState<OutboundOrder | null>(null);

    async function load() {
        const [o, p] = await Promise.all([
            outboundService.getAll(),
            productService.getAll(),
        ]);
        setOrders(o);
        setProducts(p);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleDelete(id: string) {
        await outboundService.delete(id);
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
            {shipOrder && (
                <ShipModal
                    order={shipOrder}
                    onClose={() => setShipOrder(null)}
                    onShip={load}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Відвантаження</h1>
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
                    <ArrowUpFromLine size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>Замовлень відвантаження ще немає</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            isAdmin={isAdmin}
                            onDelete={() => handleDelete(order.id)}
                            onShip={() => setShipOrder(order)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}