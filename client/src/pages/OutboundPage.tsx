import { useEffect, useState } from 'react';
import {
    ArrowUpFromLine, Plus, Trash2, Loader2,
    X, ChevronDown, ChevronRight, SendHorizontal, Download, Search
} from 'lucide-react';
import { outboundService } from '../services/outbound.service';
import { productService } from '../services/product.service';
import { warehouseService } from '../services/warehouse.service';
import { useAuth } from '../hooks/useAuth';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { exportToCsv } from '../utils/exportCsv';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import type {
    OutboundOrder, OutboundOrderRequest, ShipProductRequest,
    Product, LocationEntity, OrderStatus,
} from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../types';
import { useProductDrawer } from "../context/ProductDrawerContext.tsx";

// ─── Спільні класи ────────────────────────────────────────────────────────────

const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-[#0B0D14]/60";
const selectClass = "w-full rounded-lg px-3 py-2.5 text-sm bg-[#11131C] border border-white/[0.08] text-slate-100 outline-none transition-all focus:border-indigo-500/50 cursor-pointer";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium tracking-wide"
              style={{
                  backgroundColor: `${ORDER_STATUS_COLORS[status]}15`,
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
    const [orderNumber, setOrderNumber]   = useState('');
    const [customerName, setCustomerName] = useState('');
    const [items, setItems]               = useState([{ productId: '', quantity: 1 }]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);

    function addItem() { setItems(p => [...p, { productId: '', quantity: 1 }]); }
    function removeItem(i: number) { setItems(p => p.filter((_, idx) => idx !== i)); }
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
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка створення');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Збільшив max-w-lg до max-w-2xl для узгодженості з приходом */}
            <div className="w-full max-w-2xl rounded-xl p-6 bg-[#11131C] border border-white/[0.08] shadow-2xl max-h-[90vh] overflow-y-auto">

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-100">Нове замовлення відвантаження</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Номер замовлення *</label>
                        <input
                            value={orderNumber}
                            onChange={e => setOrderNumber(e.target.value)}
                            placeholder="OUT-2026-001"
                            className={`${inputClass} font-mono`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Клієнт *</label>
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="ТОВ Ромашка"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-400">Товари *</label>
                        <button onClick={addItem}
                                className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-transparent hover:border-indigo-500/20">
                            <Plus size={12} /> Додати рядок
                        </button>
                    </div>
                    <div className="space-y-3">
                        {/* Заголовки стовпців */}
                        {items.length > 0 && (
                            <div className="flex gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden sm:flex">
                                <div className="flex-1 min-w-0 pl-3">Назва товару</div>
                                <div className="flex gap-2 w-auto shrink-0 justify-end">
                                    <div className="w-24 text-center">Кількість</div>
                                    {/* Відступ під кошик з'являється ТІЛЬКИ якщо рядків більше одного */}
                                    {items.length > 1 && <div className="w-10 shrink-0"></div>}
                                </div>
                            </div>
                        )}

                        {items.map((item, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                {/* Селектор товару */}
                                <div className="w-full sm:flex-1 min-w-0">
                                    <select
                                        value={item.productId}
                                        onChange={e => updateItem(i, 'productId', e.target.value)}
                                        className={`${selectClass} w-full truncate`}>
                                        <option value="" className="bg-[#11131C]">— Оберіть товар —</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} className="bg-[#11131C]">
                                                {p.name} ({p.sku})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Група: Кількість + Кнопка видалення */}
                                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                                    <input
                                        type="number" min={0.001} step={0.001}
                                        value={item.quantity}
                                        onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                                        placeholder="Кіл-ть"
                                        className={`${inputClass} w-full sm:w-24 text-center shrink-0`}
                                    />
                                    {/* Кошик з'являється ТІЛЬКИ якщо рядків більше одного */}
                                    {items.length > 1 && (
                                        <div className="w-10 shrink-0 flex items-center justify-center">
                                            <button onClick={() => removeItem(i)}
                                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-center h-10 w-10">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all">
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/30 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/10">
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
    const [warehouses, setWarehouses]               = useState<{ id: string; name: string }[]>([]);
    const [locations, setLocations]                 = useState<LocationEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [form, setForm] = useState<ShipProductRequest>({
        outboundOrderId: order.id,
        productId:       order.items[0]?.productId ?? '',
        locationId:      '',
        quantity:        order.items[0]?.quantity ?? 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        warehouseService.getAll().then(data => {
            if (mounted) setWarehouses(data.map(w => ({ id: w.id, name: w.name })));
        });
        return () => { mounted = false; };
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
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка відвантаження');
        } finally {
            setLoading(false);
        }
    }

    const isValid = form.productId && form.locationId && form.quantity > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl p-6 bg-[#11131C] border border-white/[0.08] shadow-2xl">

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-100">Відвантажити товар</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-amber-500/70 mb-0.5">Замовлення</p>
                        <p className="text-sm font-mono font-bold text-amber-400">{order.orderNumber}</p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-amber-500/70 mb-0.5">Клієнт</p>
                        <p className="text-sm font-medium text-amber-100">{order.customerName}</p>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Товар *</label>
                        <select value={form.productId}
                                onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                                className={selectClass}>
                            {order.items.map(item => (
                                <option key={item.productId} value={item.productId} className="bg-[#11131C]">
                                    {item.product?.name} (потрібно: {item.quantity}, відвантажено: {item.shippedQuantity})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Склад *</label>
                        <select value={selectedWarehouse}
                                onChange={e => handleWarehouseChange(e.target.value)}
                                className={selectClass}>
                            <option value="" className="bg-[#11131C]">— Оберіть склад —</option>
                            {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[#11131C]">{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Комірка *</label>
                        <select value={form.locationId}
                                onChange={e => setForm(p => ({ ...p, locationId: e.target.value }))}
                                disabled={!locations.length}
                                className={selectClass}>
                            <option value="" className="bg-[#11131C]">— Оберіть комірку —</option>
                            {locations.map(l => <option key={l.id} value={l.id} className="bg-[#11131C]">{l.code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Кількість *</label>
                        <input type="number" min={0.001} step={0.001}
                               value={form.quantity}
                               onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                               className={inputClass}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all">
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/30 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/10">
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

function OrderRow({ order, canManage, onDelete, onShip }: {
    order: OutboundOrder;
    canManage: boolean;
    onDelete: () => void;
    onShip: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const { openProductDrawer } = useProductDrawer();

    return (
        <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0B0D14]/40 backdrop-blur-md shadow-lg transition-all">
            <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                 onClick={() => setExpanded(p => !p)}>
                <span className="text-slate-500">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-sm font-mono font-medium text-slate-100">
                        {order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                        {order.customerName}
                    </span>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                    {order.items.length} {order.items.length === 1 ? 'позиція' : order.items.length > 1 && order.items.length < 5 ? 'позиції' : 'позицій'}
                </span>
                <StatusBadge status={order.status} />

                <div className="flex items-center gap-2 pl-2" onClick={e => e.stopPropagation()}>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <button onClick={onShip}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                            <SendHorizontal size={13} />
                            <span className="hidden sm:inline">Відвантажити</span>
                        </button>
                    )}
                    {canManage && order.status === 'Draft' && (
                        <button onClick={onDelete}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="bg-black/20 border-t border-white/[0.04]">
                    <div className="grid grid-cols-[2fr_1fr_1fr] text-[11px] font-semibold uppercase tracking-wider px-4 py-2 text-slate-500 bg-[#0B0D14]/60">
                        <span>Товар</span>
                        <span className="text-right">Потрібно</span>
                        <span className="text-right">Відвантажено</span>
                    </div>
                    <div className="divide-y divide-white/[0.02]">
                        {order.items.map(item => (
                            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr] items-center px-4 py-2.5 text-sm hover:bg-white/[0.01] transition-colors">
                                {item.product ? (
                                    <button
                                        onClick={() => openProductDrawer(item.product!.id, item.product!.name, item.product!.sku)}
                                        className="text-left font-medium text-slate-300 hover:text-indigo-400 transition-colors truncate pr-2"
                                    >
                                        {item.product.name}
                                    </button>
                                ) : (
                                    <span className="text-slate-600">—</span>
                                )}
                                <span className="text-right font-mono text-slate-300">{item.quantity}</span>
                                <span className={`text-right font-mono font-medium ${item.shippedQuantity >= item.quantity ? 'text-teal-400' : 'text-amber-400'}`}>
                                    {item.shippedQuantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OutboundPage() {
    const { user }  = useAuth();
    const canManage = user?.role === 'Admin' || user?.role === 'Manager';
    const { confirm, options, handleConfirm, handleClose } = useConfirm();

    const [orders, setOrders]     = useState<OutboundOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading]   = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [shipOrder, setShipOrder]     = useState<OutboundOrder | null>(null);
    const [barcodeSearch, setBarcodeSearch] = useState('');

    async function load() {
        const [o, p] = await Promise.all([
            outboundService.getAll(),
            productService.getAll(),
        ]);
        setOrders(o);
        setProducts(p);
    }

    useEffect(() => {
        let mounted = true;
        async function init() {
            const [o, p] = await Promise.all([
                outboundService.getAll(),
                productService.getAll(),
            ]);
            if (mounted) { setOrders(o); setProducts(p); setLoading(false); }
        }
        init();
        return () => { mounted = false; };
    }, []);

    useBarcodeScanner({
        enabled: !shipOrder && !createModal,
        onScan: (barcode) => {
            const found = orders.find(
                o => o.orderNumber.toLowerCase() === barcode.toLowerCase()
            );
            if (found && found.status !== 'Completed' && found.status !== 'Cancelled') {
                setShipOrder(found);
            } else {
                setBarcodeSearch(barcode);
            }
        },
    });

    function handleExport() {
        exportToCsv('outbound_orders', orders.map(order => ({
            'Номер замовлення':     order.orderNumber,
            'Клієнт':               order.customerName,
            'Статус':               ORDER_STATUS_LABELS[order.status],
            'Кількість позицій':    order.items.length,
            'Відвантажено позицій': order.items.filter(i => i.shippedQuantity >= i.quantity).length,
        })));
    }

    async function handleDeleteClick(id: string, orderNumber: string) {
        const confirmed = await confirm({
            title:        'Видалити замовлення?',
            message:      `Замовлення "${orderNumber}" буде видалено. Цю дію неможливо скасувати.`,
            confirmLabel: 'Видалити',
            danger:       true,
        });
        if (confirmed) {
            await outboundService.delete(id);
            setOrders(p => p.filter(o => o.id !== id));
        }
    }

    const filteredOrders = barcodeSearch
        ? orders.filter(o =>
            o.orderNumber.toLowerCase().includes(barcodeSearch.toLowerCase()) ||
            o.customerName.toLowerCase().includes(barcodeSearch.toLowerCase())
        )
        : orders;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {options && (
                <ConfirmModal {...options} onConfirm={handleConfirm} onClose={handleClose} />
            )}
            {createModal && (
                <CreateOrderModal
                    products={products}
                    onClose={() => setCreateModal(false)}
                    onCreate={order => { setOrders(p => [order, ...p]); }}
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
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <ArrowUpFromLine size={22} className="text-indigo-400" />
                        Відвантаження
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {orders.length} {orders.length === 1 ? 'замовлення' : orders.length > 1 && orders.length < 5 ? 'замовлення' : 'замовлень'}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Пошук */}
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={barcodeSearch}
                            onChange={e => setBarcodeSearch(e.target.value)}
                            placeholder="Номер замовлення або клієнт..."
                            className="w-full rounded-lg pl-9 pr-4 py-2 text-sm bg-[#0B0D14]/60 backdrop-blur-md border border-white/[0.08] text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50"
                        />
                    </div>
                    {/* CSV */}
                    <button
                        onClick={handleExport}
                        disabled={orders.length === 0}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-100 disabled:opacity-40"
                        title="Експортувати в CSV"
                    >
                        <Download size={15} /> CSV
                    </button>
                    {/* Нове замовлення */}
                    {canManage && (
                        <button onClick={() => setCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                            <Plus size={16} /> <span className="hidden sm:inline">Нове замовлення</span>
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500 animate-pulse">Завантаження замовлень...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-xl border border-white/[0.04] bg-[#0B0D14]/20 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-slate-600 shadow-inner">
                        <ArrowUpFromLine size={32} />
                    </div>
                    <p className="text-sm font-medium text-slate-400">
                        {barcodeSearch ? 'За вашим запитом нічого не знайдено' : 'Замовлень відвантаження ще немає'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map(order => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            canManage={canManage}
                            onDelete={() => handleDeleteClick(order.id, order.orderNumber)}
                            onShip={() => setShipOrder(order)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}