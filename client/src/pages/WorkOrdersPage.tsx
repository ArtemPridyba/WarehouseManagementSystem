import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ClipboardList, Plus, Loader2, X, CheckCircle,
    Clock, User, ChevronDown, ChevronLeft, ChevronRight,
    Trash2, UserCheck, Package, Truck, ArrowLeftRight,
    SlidersHorizontal, Hash, Inbox,
} from 'lucide-react';
import { workOrderService } from '../services/workorder.service';
import { authService } from '../services/auth.service';
import { productService } from '../services/product.service';
import { warehouseService } from '../services/warehouse.service';
import { inventoryService } from '../services/inventory.service';
import { inboundService } from '../services/inbound.service';
import { outboundService } from '../services/outbound.service';
import { useAuth, useRole } from '../hooks/useAuth';
import type {
    WorkOrderDto, CreateWorkOrderRequest, WorkOrderStatus,
    WorkOrderType, WorkOrderPriority, EmployeeDto,
    LocationEntity, InboundOrder, OutboundOrder, ProductLocationItem, PagedResult,
} from '../types';
import {
    WORK_ORDER_TYPE_LABELS, WORK_ORDER_STATUS_LABELS,
    WORK_ORDER_STATUS_COLORS, WORK_ORDER_PRIORITY_LABELS,
    WORK_ORDER_PRIORITY_COLORS, ORDER_STATUS_LABELS,
} from '../types';

// ─── Константи ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<WorkOrderType, string> = {
    Receive:  '#2dd4bf',
    Ship:     '#f59e0b',
    Transfer: '#6366f1',
    Adjust:   '#f87171',
    Count:    '#a78bfa',
};

const TYPE_ICONS: Record<WorkOrderType, React.ReactNode> = {
    Receive:  <Package size={15} />,
    Ship:     <Truck size={15} />,
    Transfer: <ArrowLeftRight size={15} />,
    Adjust:   <SlidersHorizontal size={15} />,
    Count:    <Hash size={15} />,
};

const TYPES: WorkOrderType[]       = ['Receive', 'Ship', 'Transfer', 'Adjust', 'Count'];
const PRIORITIES: WorkOrderPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

type TabMode = 'all' | 'my' | 'free';

// ─── Shared input classes ─────────────────────────────────────────────────────

const inputCls =
    'w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.04] border border-white/10 text-slate-200 outline-none ' +
    'placeholder:text-slate-600 focus:border-indigo-500/60 transition-colors';

const selectCls =
    'w-full rounded-lg px-3 py-2.5 text-sm bg-[#1e2130] border border-white/10 text-slate-200 outline-none ' +
    'focus:border-indigo-500/60 transition-colors';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkOrderStatus }) {
    const color = WORK_ORDER_STATUS_COLORS[status];
    return (
        <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}30`,
            }}
        >
            {WORK_ORDER_STATUS_LABELS[status]}
        </span>
    );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
    const color = WORK_ORDER_PRIORITY_COLORS[priority];
    return (
        <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: `${color}15`, color }}
        >
            {WORK_ORDER_PRIORITY_LABELS[priority]}
        </span>
    );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: WorkOrderType }) {
    const color = TYPE_COLORS[type];
    return (
        <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: `${color}15`, color }}
        >
            {TYPE_ICONS[type]}
            {WORK_ORDER_TYPE_LABELS[type]}
        </span>
    );
}

// ─── Label helper ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-xs mb-1.5 font-medium text-slate-400">
            {children}
        </label>
    );
}

// ─── Section block inside modal ───────────────────────────────────────────────

function ModalSection({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <div
            className="space-y-3 rounded-lg p-3"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}
        >
            {children}
        </div>
    );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
                         employees,
                         onClose,
                         onCreate,
                     }: {
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
    const [error, setError]     = useState<string | null>(null);

    const [inboundOrders, setInboundOrders]       = useState<InboundOrder[]>([]);
    const [outboundOrders, setOutboundOrders]     = useState<OutboundOrder[]>([]);
    const [products, setProducts]                 = useState<{ id: string; name: string; sku: string }[]>([]);
    const [warehouses, setWarehouses]             = useState<{ id: string; name: string }[]>([]);
    const [fromLocations, setFromLocations]       = useState<(LocationEntity & { availableQuantity: number })[]>([]);
    const [toLocations, setToLocations]           = useState<LocationEntity[]>([]);
    const [selectedFromWarehouse, setSelectedFromWarehouse] = useState('');
    const [selectedToWarehouse, setSelectedToWarehouse]     = useState('');
    const [productLocations, setProductLocations] = useState<ProductLocationItem[]>([]);
    const [availableWarehouses, setAvailableWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [locationsLoading, setLocationsLoading] = useState(false);

    useEffect(() => {
        setForm(p => ({
            ...p,
            inboundOrderId: undefined, outboundOrderId: undefined,
            productId: undefined, fromLocationId: undefined, toLocationId: undefined, quantity: undefined,
        }));
        setFromLocations([]); setToLocations([]);
        setSelectedFromWarehouse(''); setSelectedToWarehouse('');
        setProductLocations([]); setAvailableWarehouses([]);

        if (form.type === 'Receive') {
            inboundService.getAll().then(data =>
                setInboundOrders(data.filter(o => o.status === 'Draft' || o.status === 'InProgress'))
            );
        } else if (form.type === 'Ship') {
            outboundService.getAll().then(data =>
                setOutboundOrders(data.filter(o => o.status === 'Draft' || o.status === 'InProgress'))
            );
        } else if (['Transfer', 'Adjust', 'Count'].includes(form.type)) {
            productService.getAll().then(data => setProducts(data.map(p => ({ id: p.id, name: p.name, sku: p.sku }))));
            warehouseService.getAll().then(data => setWarehouses(data.map(w => ({ id: w.id, name: w.name }))));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.type]);

    useEffect(() => {
        if (form.type !== 'Transfer' || !form.productId) {
            setProductLocations([]); setAvailableWarehouses([]); setFromLocations([]);
            setSelectedFromWarehouse('');
            setForm(p => ({ ...p, fromLocationId: undefined }));
            return;
        }
        async function loadProductLocations() {
            setLocationsLoading(true);
            try {
                const [locs, allWarehouses] = await Promise.all([
                    inventoryService.getProductLocations(form.productId!),
                    warehouseService.getAll(),
                ]);
                setProductLocations(locs);
                if (locs.length === 0) { setAvailableWarehouses([]); return; }
                const locationIds = new Set(locs.map(l => l.locationId));
                const matched: { id: string; name: string }[] = [];
                for (const wh of allWarehouses) {
                    const zones = await warehouseService.getZones(wh.id);
                    for (const zone of zones) {
                        const zoneLocs = await warehouseService.getLocations(zone.id);
                        if (zoneLocs.some(l => locationIds.has(l.id)) && !matched.find(w => w.id === wh.id)) {
                            matched.push({ id: wh.id, name: wh.name });
                        }
                    }
                }
                setAvailableWarehouses(matched);
                setSelectedFromWarehouse(''); setFromLocations([]);
                setForm(p => ({ ...p, fromLocationId: undefined }));
            } finally {
                setLocationsLoading(false);
            }
        }
        loadProductLocations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.productId, form.type]);

    function handleInboundOrderChange(orderId: string) {
        const order = inboundOrders.find(o => o.id === orderId);
        setForm(p => ({
            ...p,
            inboundOrderId: orderId || undefined,
            productId: undefined,
            title: order ? `Приймання по замовленню ${order.orderNumber}` : p.title,
        }));
    }

    function handleOutboundOrderChange(orderId: string) {
        const order = outboundOrders.find(o => o.id === orderId);
        setForm(p => ({
            ...p,
            outboundOrderId: orderId || undefined,
            productId: undefined,
            title: order ? `Відвантаження по замовленню ${order.orderNumber}` : p.title,
        }));
    }

    async function loadAllLocations(warehouseId: string): Promise<LocationEntity[]> {
        const zones = await warehouseService.getZones(warehouseId);
        const all: LocationEntity[] = [];
        for (const zone of zones) all.push(...(await warehouseService.getLocations(zone.id)));
        return all;
    }

    async function handleFromWarehouseChange(warehouseId: string) {
        setSelectedFromWarehouse(warehouseId);
        setFromLocations([]); setForm(p => ({ ...p, fromLocationId: undefined }));
        if (!warehouseId) return;
        if (form.type === 'Transfer' && productLocations.length > 0) {
            const locationIds = new Set(productLocations.map(l => l.locationId));
            const zones = await warehouseService.getZones(warehouseId);
            const matched: (LocationEntity & { availableQuantity: number })[] = [];
            for (const zone of zones) {
                const locs = await warehouseService.getLocations(zone.id);
                for (const loc of locs) {
                    if (locationIds.has(loc.id)) {
                        const pl = productLocations.find(p => p.locationId === loc.id)!;
                        matched.push({ ...loc, availableQuantity: pl.availableQuantity });
                    }
                }
            }
            setFromLocations(matched);
        } else {
            setFromLocations((await loadAllLocations(warehouseId)).map(l => ({ ...l, availableQuantity: 0 })));
        }
    }

    async function handleToWarehouseChange(warehouseId: string) {
        setSelectedToWarehouse(warehouseId);
        setToLocations([]); setForm(p => ({ ...p, toLocationId: undefined }));
        if (warehouseId) setToLocations(await loadAllLocations(warehouseId));
    }

    const inboundOrderItems  = form.inboundOrderId  ? (inboundOrders.find(o => o.id === form.inboundOrderId)?.items  ?? []) : [];
    const outboundOrderItems = form.outboundOrderId ? (outboundOrders.find(o => o.id === form.outboundOrderId)?.items ?? []) : [];
    const selectedFromLocation   = fromLocations.find(l => l.id === form.fromLocationId);
    const quantityExceedsStock   = form.type === 'Transfer' && selectedFromLocation && (form.quantity ?? 0) > selectedFromLocation.availableQuantity;
    const dueDateInPast          = !!form.dueDate && new Date(form.dueDate) < new Date(new Date().toDateString());

    const isValid = (() => {
        if (form.title.trim().length < 3) return false;
        if (dueDateInPast) return false;
        if (form.type === 'Receive') return !!form.inboundOrderId && !!form.productId;
        if (form.type === 'Ship')    return !!form.outboundOrderId && !!form.productId;
        if (form.type === 'Transfer') {
            if (!form.productId || !form.fromLocationId || !form.toLocationId) return false;
            if ((form.quantity ?? 0) <= 0 || quantityExceedsStock) return false;
            return true;
        }
        if (form.type === 'Adjust' || form.type === 'Count') return !!form.productId && !!form.fromLocationId;
        return true;
    })();

    async function handleSubmit() {
        setError(null); setLoading(true);
        try {
            await workOrderService.create({
                ...form,
                assignedToId:    form.assignedToId    || undefined,
                dueDate:         form.dueDate         || undefined,
                description:     form.description     || undefined,
                inboundOrderId:  form.inboundOrderId  || undefined,
                outboundOrderId: form.outboundOrderId || undefined,
                productId:       form.productId       || undefined,
                fromLocationId:  form.fromLocationId  || undefined,
                toLocationId:    form.toLocationId    || undefined,
            });
            onCreate(); onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка створення');
        } finally {
            setLoading(false);
        }
    }

    const color = TYPE_COLORS[form.type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0B0D14] border border-white/[0.08] shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-100">Нове завдання</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/[0.08] border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Тип */}
                    <div>
                        <FieldLabel>Тип завдання *</FieldLabel>
                        <div className="grid grid-cols-5 gap-2">
                            {TYPES.map(type => {
                                const c          = TYPE_COLORS[type];
                                const isSelected = form.type === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, type }))}
                                        className="py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1"
                                        style={{
                                            background: isSelected ? `${c}20` : 'rgba(255,255,255,0.03)',
                                            border:     `1px solid ${isSelected ? c : 'rgba(255,255,255,0.08)'}`,
                                            color:      isSelected ? c : '#475569',
                                        }}
                                    >
                                        <span style={{ color: isSelected ? c : '#334155' }}>{TYPE_ICONS[type]}</span>
                                        {WORK_ORDER_TYPE_LABELS[type]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RECEIVE */}
                    {form.type === 'Receive' && (
                        <ModalSection color={color}>
                            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color }}>
                                <Package size={13} /> Параметри приймання
                            </p>
                            <div>
                                <FieldLabel>Замовлення приходу *</FieldLabel>
                                <select value={form.inboundOrderId ?? ''} onChange={e => handleInboundOrderChange(e.target.value)} className={selectCls}>
                                    <option value="">— Оберіть замовлення —</option>
                                    {inboundOrders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} ({ORDER_STATUS_LABELS[o.status]})</option>)}
                                </select>
                            </div>
                            {form.inboundOrderId && (
                                <div>
                                    <FieldLabel>Товар *</FieldLabel>
                                    <select value={form.productId ?? ''} onChange={e => setForm(p => ({ ...p, productId: e.target.value || undefined }))} className={selectCls}>
                                        <option value="">— Оберіть товар —</option>
                                        {inboundOrderItems.map(item => (
                                            <option key={item.productId} value={item.productId}>
                                                {item.product.name} ({item.product.sku}) — {item.receivedQuantity}/{item.quantity} прийнято
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {form.inboundOrderId && form.productId && (
                                <div>
                                    <FieldLabel>Кількість (необов'язково)</FieldLabel>
                                    <input type="number" min={0.001} step={0.001} value={form.quantity ?? ''}
                                           onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || undefined }))}
                                           placeholder="Заповниться при виконанні" className={inputCls} />
                                </div>
                            )}
                        </ModalSection>
                    )}

                    {/* SHIP */}
                    {form.type === 'Ship' && (
                        <ModalSection color={color}>
                            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color }}>
                                <Truck size={13} /> Параметри відвантаження
                            </p>
                            <div>
                                <FieldLabel>Замовлення відвантаження *</FieldLabel>
                                <select value={form.outboundOrderId ?? ''} onChange={e => handleOutboundOrderChange(e.target.value)} className={selectCls}>
                                    <option value="">— Оберіть замовлення —</option>
                                    {outboundOrders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} — {o.customerName} ({ORDER_STATUS_LABELS[o.status]})</option>)}
                                </select>
                            </div>
                            {form.outboundOrderId && (
                                <div>
                                    <FieldLabel>Товар *</FieldLabel>
                                    <select value={form.productId ?? ''} onChange={e => setForm(p => ({ ...p, productId: e.target.value || undefined }))} className={selectCls}>
                                        <option value="">— Оберіть товар —</option>
                                        {outboundOrderItems.map(item => (
                                            <option key={item.productId} value={item.productId}>
                                                {item.product.name} ({item.product.sku}) — {item.shippedQuantity}/{item.quantity} відвантажено
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {form.outboundOrderId && form.productId && (
                                <div>
                                    <FieldLabel>Кількість (необов'язково)</FieldLabel>
                                    <input type="number" min={0.001} step={0.001} value={form.quantity ?? ''}
                                           onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || undefined }))}
                                           placeholder="Заповниться при виконанні" className={inputCls} />
                                </div>
                            )}
                        </ModalSection>
                    )}

                    {/* TRANSFER */}
                    {form.type === 'Transfer' && (
                        <ModalSection color={color}>
                            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color }}>
                                <ArrowLeftRight size={13} /> Параметри переміщення
                            </p>
                            <div>
                                <FieldLabel>Товар *</FieldLabel>
                                <select value={form.productId ?? ''} onChange={e => setForm(p => ({ ...p, productId: e.target.value || undefined }))} className={selectCls}>
                                    <option value="">— Оберіть товар —</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>
                            {form.productId && locationsLoading && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Loader2 size={12} className="animate-spin" /> Пошук доступних локацій...
                                </div>
                            )}
                            {form.productId && !locationsLoading && availableWarehouses.length === 0 && (
                                <div className="text-xs px-3 py-2 rounded-lg bg-rose-500/[0.08] border border-rose-500/20 text-rose-400">
                                    Цього товару немає на жодному складі
                                </div>
                            )}
                            {form.productId && !locationsLoading && availableWarehouses.length > 0 && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <FieldLabel>Склад (звідки) *</FieldLabel>
                                            <select value={selectedFromWarehouse} onChange={e => handleFromWarehouseChange(e.target.value)} className={selectCls}>
                                                <option value="">— Склад —</option>
                                                {availableWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <FieldLabel>Комірка (звідки) *</FieldLabel>
                                            <select value={form.fromLocationId ?? ''} onChange={e => setForm(p => ({ ...p, fromLocationId: e.target.value || undefined }))} disabled={!fromLocations.length} className={selectCls}>
                                                <option value="">— Комірка —</option>
                                                {fromLocations.map(l => <option key={l.id} value={l.id}>{l.code} (є: {l.availableQuantity})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <FieldLabel>Склад (куди) *</FieldLabel>
                                            <select value={selectedToWarehouse} onChange={e => handleToWarehouseChange(e.target.value)} className={selectCls}>
                                                <option value="">— Склад —</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <FieldLabel>Комірка (куди) *</FieldLabel>
                                            <select value={form.toLocationId ?? ''} onChange={e => setForm(p => ({ ...p, toLocationId: e.target.value || undefined }))} disabled={!toLocations.length} className={selectCls}>
                                                <option value="">— Комірка —</option>
                                                {toLocations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>
                                            Кількість *
                                            {selectedFromLocation && (
                                                <span className="ml-2 font-normal text-slate-500">
                                                    (доступно: <span className="text-teal-400">{selectedFromLocation.availableQuantity}</span>)
                                                </span>
                                            )}
                                        </FieldLabel>
                                        <input
                                            type="number" min={0.001} step={0.001}
                                            value={form.quantity ?? ''}
                                            onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || undefined }))}
                                            className={`${inputCls} ${quantityExceedsStock ? '!border-rose-500/60' : ''}`}
                                        />
                                        {quantityExceedsStock && (
                                            <p className="text-xs mt-1 text-rose-400">
                                                Недостатньо товару. Доступно: {selectedFromLocation!.availableQuantity}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </ModalSection>
                    )}

                    {/* ADJUST / COUNT */}
                    {(form.type === 'Adjust' || form.type === 'Count') && (
                        <ModalSection color={color}>
                            <p className="text-xs font-medium flex items-center gap-1.5" style={{ color }}>
                                {TYPE_ICONS[form.type]}
                                {form.type === 'Adjust' ? 'Параметри коригування' : 'Параметри перерахунку'}
                            </p>
                            <div>
                                <FieldLabel>Товар *</FieldLabel>
                                <select value={form.productId ?? ''} onChange={e => setForm(p => ({ ...p, productId: e.target.value || undefined }))} className={selectCls}>
                                    <option value="">— Оберіть товар —</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Склад *</FieldLabel>
                                    <select value={selectedFromWarehouse} onChange={e => handleFromWarehouseChange(e.target.value)} className={selectCls}>
                                        <option value="">— Склад —</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <FieldLabel>Комірка *</FieldLabel>
                                    <select value={form.fromLocationId ?? ''} onChange={e => setForm(p => ({ ...p, fromLocationId: e.target.value || undefined }))} disabled={!fromLocations.length} className={selectCls}>
                                        <option value="">— Комірка —</option>
                                        {fromLocations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            {form.type === 'Adjust' && (
                                <div>
                                    <FieldLabel>Нова кількість (необов'язково)</FieldLabel>
                                    <input type="number" min={0} step={0.001} value={form.quantity ?? ''}
                                           onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || undefined }))}
                                           placeholder="Заповниться при виконанні" className={inputCls} />
                                </div>
                            )}
                        </ModalSection>
                    )}

                    {/* Заголовок */}
                    <div>
                        <FieldLabel>Заголовок *</FieldLabel>
                        <input
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            placeholder="Наприклад: Прийняти товар по замовленню INB-001"
                            className={inputCls}
                        />
                    </div>

                    {/* Опис */}
                    <div>
                        <FieldLabel>Опис</FieldLabel>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Детальний опис завдання..."
                            rows={2}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Пріоритет + Дедлайн */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <FieldLabel>Пріоритет</FieldLabel>
                            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as WorkOrderPriority }))} className={selectCls}>
                                {PRIORITIES.map(p => <option key={p} value={p}>{WORK_ORDER_PRIORITY_LABELS[p]}</option>)}
                            </select>
                        </div>
                        <div>
                            <FieldLabel>Дедлайн</FieldLabel>
                            <input
                                type="date"
                                value={form.dueDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                                className={`${inputCls} ${dueDateInPast ? '!border-rose-500/60' : ''}`}
                            />
                            {dueDateInPast && <p className="text-xs mt-1 text-rose-400">Дедлайн не може бути в минулому</p>}
                        </div>
                    </div>

                    {/* Виконавець */}
                    <div>
                        <FieldLabel>
                            Призначити виконавця
                            <span className="ml-1 font-normal text-slate-600"> (залиште порожнім для вільного завдання)</span>
                        </FieldLabel>
                        <select value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))} className={selectCls}>
                            <option value="">— Вільне завдання —</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.role})</option>)}
                        </select>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] transition-all"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: loading || !isValid ? 'rgba(99,102,241,0.5)' : '#6366f1' }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Створити завдання
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Complete Modal ───────────────────────────────────────────────────────────

function CompleteModal({
                           order,
                           onClose,
                           onDone,
                       }: {
    order: WorkOrderDto;
    onClose: () => void;
    onDone: () => void;
}) {
    const [note, setNote]                   = useState('');
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [warehouses, setWarehouses]       = useState<{ id: string; name: string }[]>([]);
    const [locations, setLocations]         = useState<LocationEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [transferLocationId, setTransferLocationId] = useState(order.toLocationId ?? '');
    const [transferQty, setTransferQty]     = useState<number>(order.quantity ?? 1);
    const [receiveLocationId, setReceiveLocationId] = useState(order.toLocationId ?? '');
    const [receiveQty, setReceiveQty]       = useState<number>(order.quantity ?? 1);
    const [batchNumber, setBatchNumber]     = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [shipLocationId, setShipLocationId] = useState(order.fromLocationId ?? '');
    const [shipQty, setShipQty]             = useState<number>(order.quantity ?? 1);

    const needsWarehouse = ['Transfer', 'Receive', 'Ship'].includes(order.type);

    useEffect(() => {
        if (needsWarehouse) warehouseService.getAll().then(data => setWarehouses(data.map(w => ({ id: w.id, name: w.name }))));
    }, [needsWarehouse]);

    async function handleWarehouseChange(warehouseId: string) {
        setSelectedWarehouse(warehouseId);
        const zones = await warehouseService.getZones(warehouseId);
        const all: LocationEntity[] = [];
        for (const zone of zones) all.push(...(await warehouseService.getLocations(zone.id)));
        setLocations(all);
    }

    async function handleComplete() {
        setError(null); setLoading(true);
        try {
            if (order.type === 'Transfer' && order.productId && order.fromLocationId) {
                await inventoryService.transfer({ productId: order.productId, fromLocationId: order.fromLocationId, toLocationId: transferLocationId, quantity: transferQty });
            } else if (order.type === 'Receive' && order.inboundOrderId && order.productId) {
                await inboundService.receive({ inboundOrderId: order.inboundOrderId, productId: order.productId, locationId: receiveLocationId, quantity: receiveQty, batchNumber: batchNumber || undefined, expirationDate: expirationDate || undefined });
            } else if (order.type === 'Ship' && order.outboundOrderId && order.productId) {
                await outboundService.ship({ outboundOrderId: order.outboundOrderId, productId: order.productId, locationId: shipLocationId, quantity: shipQty });
            }
            await workOrderService.updateStatus(order.id, { status: 'Completed', completionNote: note || undefined });
            onDone(); onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка виконання');
        } finally {
            setLoading(false);
        }
    }

    const isValid = () => {
        if (order.type === 'Transfer') return !!transferLocationId && transferQty > 0;
        if (order.type === 'Receive')  return !!receiveLocationId  && receiveQty  > 0;
        if (order.type === 'Ship')     return !!shipLocationId     && shipQty     > 0;
        return true;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0B0D14] border border-white/[0.08] shadow-2xl">

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-100">Виконати завдання</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="rounded-lg px-3 py-2.5 mb-4 bg-indigo-500/[0.08] border border-indigo-500/15">
                    <p className="text-sm font-medium text-indigo-300">{order.title}</p>
                    {order.productName && (
                        <p className="text-xs mt-0.5 text-slate-500">
                            Товар: <span className="text-slate-400">{order.productName}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/[0.08] border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {order.type === 'Transfer' && (
                        <>
                            <div className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] text-slate-500">
                                З комірки: <span className="text-slate-400">{order.fromLocationCode ?? '—'}</span>
                            </div>
                            <div>
                                <FieldLabel>Склад *</FieldLabel>
                                <select value={selectedWarehouse} onChange={e => handleWarehouseChange(e.target.value)} className={selectCls}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Комірка призначення *</FieldLabel>
                                <select value={transferLocationId} onChange={e => setTransferLocationId(e.target.value)} disabled={!locations.length} className={selectCls}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Кількість *</FieldLabel>
                                <input type="number" min={0.001} step={0.001} value={transferQty} onChange={e => setTransferQty(parseFloat(e.target.value))} className={inputCls} />
                            </div>
                        </>
                    )}

                    {order.type === 'Receive' && (
                        <>
                            {order.inboundOrderNumber && (
                                <div className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] text-slate-500">
                                    Замовлення: <span className="font-mono text-slate-400">{order.inboundOrderNumber}</span>
                                </div>
                            )}
                            <div>
                                <FieldLabel>Склад *</FieldLabel>
                                <select value={selectedWarehouse} onChange={e => handleWarehouseChange(e.target.value)} className={selectCls}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Комірка *</FieldLabel>
                                <select value={receiveLocationId} onChange={e => setReceiveLocationId(e.target.value)} disabled={!locations.length} className={selectCls}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Кількість *</FieldLabel>
                                <input type="number" min={0.001} step={0.001} value={receiveQty} onChange={e => setReceiveQty(parseFloat(e.target.value))} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>Партія</FieldLabel>
                                    <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="BATCH-001" className={`${inputCls} font-mono`} />
                                </div>
                                <div>
                                    <FieldLabel>Термін</FieldLabel>
                                    <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </>
                    )}

                    {order.type === 'Ship' && (
                        <>
                            {order.outboundOrderNumber && (
                                <div className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] text-slate-500">
                                    Замовлення: <span className="font-mono text-slate-400">{order.outboundOrderNumber}</span>
                                </div>
                            )}
                            <div>
                                <FieldLabel>Склад *</FieldLabel>
                                <select value={selectedWarehouse} onChange={e => handleWarehouseChange(e.target.value)} className={selectCls}>
                                    <option value="">— Оберіть склад —</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Комірка списання *</FieldLabel>
                                <select value={shipLocationId} onChange={e => setShipLocationId(e.target.value)} disabled={!locations.length} className={selectCls}>
                                    <option value="">— Оберіть комірку —</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Кількість *</FieldLabel>
                                <input type="number" min={0.001} step={0.001} value={shipQty} onChange={e => setShipQty(parseFloat(e.target.value))} className={inputCls} />
                            </div>
                        </>
                    )}

                    {(order.type === 'Count' || order.type === 'Adjust') && (
                        <div className="text-sm px-3 py-2.5 rounded-lg bg-white/[0.03] text-slate-400">
                            Підтвердіть що завдання виконано фізично на складі.
                        </div>
                    )}

                    <div>
                        <FieldLabel>Коментар до виконання</FieldLabel>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Примітки..." rows={2} className={`${inputCls} resize-none`} />
                    </div>
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] transition-all">
                        Скасувати
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={loading || !isValid()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: loading || !isValid() ? 'rgba(13,148,136,0.5)' : '#0d9488' }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <CheckCircle size={14} /> Виконати
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Work Order Card ──────────────────────────────────────────────────────────

function WorkOrderCard({
                           order, canManage, currentUserId,
                           onComplete, onDelete, onAssign, onStatusChange, onTake,
                       }: {
    order: WorkOrderDto;
    canManage: boolean;
    currentUserId: string;
    onComplete: () => void;
    onDelete: () => void;
    onAssign: () => void;
    onStatusChange: (status: WorkOrderStatus) => void;
    onTake: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const isMyTask    = order.assignedToId === currentUserId;
    const isFree      = !order.assignedToId;
    const canComplete = (isMyTask || canManage) && order.status !== 'Completed' && order.status !== 'Cancelled';
    const isOverdue   = order.dueDate && new Date(order.dueDate) < new Date() && order.status !== 'Completed';

    const borderColor = isOverdue
        ? 'border-rose-500/30'
        : isFree
            ? 'border-teal-500/20'
            : 'border-white/[0.06]';

    return (
        <div className={`rounded-xl overflow-hidden bg-[#0B0D14]/60 backdrop-blur-md border ${borderColor} shadow-lg transition-all duration-200 hover:border-white/10 hover:-translate-y-px`}>
            {/* Card header */}
            <div className="px-4 py-3 cursor-pointer" onClick={() => setExpanded(p => !p)}>
                <div className="flex items-center gap-3">
                    {/* Type icon */}
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${TYPE_COLORS[order.type]}15`, color: TYPE_COLORS[order.type] }}
                    >
                        {TYPE_ICONS[order.type]}
                    </div>

                    {/* Title + badges */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium text-slate-100 truncate">{order.title}</p>
                            {isFree && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400">Вільне</span>
                            )}
                            {isOverdue && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">Прострочено</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={order.status} />
                            <PriorityBadge priority={order.priority} />
                            <TypeBadge type={order.type} />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {isFree && order.status === 'Pending' && (
                            <button
                                onClick={onTake}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
                            >
                                <UserCheck size={12} /> Взяти завдання
                            </button>
                        )}
                        {order.status === 'Pending' && (isMyTask || canManage) && !isFree && (
                            <button
                                onClick={() => onStatusChange('InProgress')}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                            >
                                Взяти в роботу
                            </button>
                        )}
                        {canComplete && order.status === 'InProgress' && (
                            <button
                                onClick={onComplete}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
                            >
                                <CheckCircle size={12} /> Виконано
                            </button>
                        )}
                        {canManage && !order.assignedToId && order.status === 'Pending' && (
                            <button
                                onClick={onAssign}
                                className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                title="Призначити виконавця"
                            >
                                <UserCheck size={15} />
                            </button>
                        )}
                        {canManage && order.status !== 'Completed' && (
                            <button
                                onClick={onDelete}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Видалити"
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                        <span className="text-slate-600">
                            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04]">
                    {order.description && (
                        <p className="text-sm pt-3 text-slate-500">{order.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {order.assignedToName ? (
                            <div className="flex items-center gap-2">
                                <User size={13} className="text-slate-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-600">Виконавець</p>
                                    <p className="text-xs font-medium text-slate-400">{order.assignedToName}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Inbox size={13} className="text-teal-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-600">Виконавець</p>
                                    <p className="text-xs font-medium text-teal-400">Вільне завдання</p>
                                </div>
                            </div>
                        )}
                        {order.dueDate && (
                            <div className="flex items-center gap-2">
                                <Clock size={13} className={`shrink-0 ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`} />
                                <div>
                                    <p className="text-xs text-slate-600">Дедлайн</p>
                                    <p className={`text-xs font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {new Date(order.dueDate).toLocaleDateString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                        )}
                        {order.productName && (
                            <div>
                                <p className="text-xs text-slate-600">Товар</p>
                                <p className="text-xs font-medium text-slate-400">{order.productName}</p>
                            </div>
                        )}
                        {order.inboundOrderNumber && (
                            <div>
                                <p className="text-xs text-slate-600">Замовлення приходу</p>
                                <p className="text-xs font-mono font-medium text-slate-400">{order.inboundOrderNumber}</p>
                            </div>
                        )}
                        {order.outboundOrderNumber && (
                            <div>
                                <p className="text-xs text-slate-600">Замовлення відвантаження</p>
                                <p className="text-xs font-mono font-medium text-slate-400">{order.outboundOrderNumber}</p>
                            </div>
                        )}
                        {order.fromLocationCode && (
                            <div>
                                <p className="text-xs text-slate-600">З комірки</p>
                                <p className="text-xs font-mono font-medium text-slate-400">{order.fromLocationCode}</p>
                            </div>
                        )}
                        {order.toLocationCode && (
                            <div>
                                <p className="text-xs text-slate-600">До комірки</p>
                                <p className="text-xs font-mono font-medium text-slate-400">{order.toLocationCode}</p>
                            </div>
                        )}
                        {order.quantity && (
                            <div>
                                <p className="text-xs text-slate-600">Кількість</p>
                                <p className="text-xs font-medium text-slate-400">{order.quantity} од.</p>
                            </div>
                        )}
                    </div>

                    {order.completionNote && (
                        <div className="rounded-lg px-3 py-2 bg-teal-500/[0.06] border border-teal-500/15">
                            <p className="text-xs text-slate-600">Коментар до виконання</p>
                            <p className="text-xs mt-0.5 text-teal-400">{order.completionNote}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-slate-700">Створив: {order.createdByName}</p>
                        <p className="text-xs text-slate-700">{new Date(order.createdAt).toLocaleDateString('uk-UA')}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({
                         order,
                         employees,
                         onClose,
                         onDone,
                     }: {
    order: WorkOrderDto;
    employees: EmployeeDto[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [assignedToId, setAssignedToId] = useState('');
    const [loading, setLoading]           = useState(false);

    async function handle() {
        if (!assignedToId) return;
        setLoading(true);
        try {
            await workOrderService.assign(order.id, { assignedToId });
            onDone(); onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl p-6 bg-[#0B0D14] border border-white/[0.08] shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-100">Призначити виконавця</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm mb-4 truncate text-slate-500">{order.title}</p>
                <select
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className={`${selectCls} mb-4`}
                >
                    <option value="">— Оберіть виконавця —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.role})</option>)}
                </select>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] transition-all">
                        Скасувати
                    </button>
                    <button
                        onClick={handle}
                        disabled={loading || !assignedToId}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: loading || !assignedToId ? 'rgba(99,102,241,0.5)' : '#6366f1' }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Призначити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function WorkOrdersPage() {
    const { user }      = useAuth();
    const { canManage } = useRole();

    const [result, setResult]               = useState<PagedResult<WorkOrderDto> | null>(null);
    const [employees, setEmployees]         = useState<EmployeeDto[]>([]);
    const [loading, setLoading]             = useState(true);
    const [page, setPage]                   = useState(1);
    const [tab, setTab]                     = useState<TabMode>(!canManage ? 'my' : 'all');
    const [filterStatus, setFilterStatus]   = useState<WorkOrderStatus | ''>('');
    const [createModal, setCreateModal]     = useState(false);
    const [completeOrder, setCompleteOrder] = useState<WorkOrderDto | null>(null);
    const [assignOrder, setAssignOrder]     = useState<WorkOrderDto | null>(null);

    // Стейт та реф для кастомного селектора
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const [orders, emps] = await Promise.all([
                workOrderService.getPaged({
                    page: p, pageSize: PAGE_SIZE,
                    status:   filterStatus as WorkOrderStatus || undefined,
                    myOnly:   tab === 'my',
                    freeOnly: tab === 'free',
                }),
                canManage ? authService.getEmployees() : Promise.resolve([]),
            ]);
            setResult(orders);
            setEmployees(emps);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, tab, canManage]);

    useEffect(() => {
        let mounted = true;
        setPage(1);
        load(1).then(() => { if (!mounted) return; });
        return () => { mounted = false; };
    }, [load]);

    // Закриття селектора по кліку зовні
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setStatusDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handlePageChange(next: number) {
        setPage(next);
        load(next);
    }

    async function handleDelete(id: string) {
        await workOrderService.delete(id);
        await load(page);
    }

    async function handleStatusChange(id: string, status: WorkOrderStatus) {
        await workOrderService.updateStatus(id, { status });
        await load(page);
    }

    async function handleTake(id: string) {
        await workOrderService.take(id);
        await load(page);
    }

    const STATUSES: { value: WorkOrderStatus | ''; label: string }[] = [
        { value: '',           label: 'Всі статуси' },
        { value: 'Pending',    label: 'Очікують' },
        { value: 'InProgress', label: 'В роботі' },
        { value: 'Completed',  label: 'Виконані' },
        { value: 'Cancelled',  label: 'Скасовані' },
    ];

    const TAB_LABELS: Record<TabMode, string> = {
        all:  'Всі',
        my:   'Мої завдання',
        free: 'Доступні',
    };

    const orders     = result?.items ?? [];
    const pending    = orders.filter(o => o.status === 'Pending').length;
    const inProgress = orders.filter(o => o.status === 'InProgress').length;

    const activeStatusName = STATUSES.find(s => s.value === filterStatus)?.label;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Modals */}
            {createModal && (
                <CreateModal employees={employees} onClose={() => setCreateModal(false)} onCreate={() => load(page)} />
            )}
            {completeOrder && (
                <CompleteModal order={completeOrder} onClose={() => setCompleteOrder(null)} onDone={() => load(page)} />
            )}
            {assignOrder && (
                <AssignModal order={assignOrder} employees={employees} onClose={() => setAssignOrder(null)} onDone={() => load(page)} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-100">Завдання</h1>
                    <p className="text-sm mt-0.5 text-slate-500">
                        {result ? `${result.totalCount} завдань` : '…'}
                        {pending    > 0 && <span className="text-amber-400"> · {pending} очікують</span>}
                        {inProgress > 0 && <span className="text-indigo-400"> · {inProgress} в роботі</span>}
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={16} /> Нове завдання
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
                {/* Tab switcher */}
                <div className="flex rounded-lg overflow-hidden border border-white/[0.08] bg-[#0B0D14]/40">
                    {(['all', 'my', 'free'] as TabMode[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-4 py-2 text-sm font-medium transition-all ${
                                tab === key
                                    ? 'bg-indigo-500/15 text-indigo-300'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                            }`}
                        >
                            {TAB_LABELS[key]}
                        </button>
                    ))}
                </div>

                {/* Кастомний Селектор Статусів */}
                {tab !== 'free' && (
                    <div className="relative w-full sm:w-48" ref={statusDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.08] text-left outline-none transition-all focus:border-indigo-500/50"
                        >
                            <span className={filterStatus ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                                {activeStatusName || 'Всі статуси'}
                            </span>
                            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {statusDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-xl border border-white/[0.08] bg-[#11131C] shadow-2xl p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                {STATUSES.map(s => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => { setFilterStatus(s.value); setStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                                            filterStatus === s.value
                                                ? 'bg-indigo-600/20 text-indigo-400 font-medium border-l-2 border-indigo-500'
                                                : 'text-slate-300 hover:bg-white/[0.04] hover:text-slate-100'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'free' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-teal-500/[0.06] border border-teal-500/15 text-teal-400">
                        <Inbox size={13} /> Завдання без виконавця — натисніть "Взяти завдання" щоб призначити собі
                    </div>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 size={28} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500 animate-pulse">Завантаження завдань...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 rounded-xl border border-white/[0.04] bg-[#0B0D14]/40">
                    <ClipboardList size={36} className="text-slate-700" />
                    <p className="text-sm text-slate-600">
                        {tab === 'my'   ? 'Немає активних завдань'
                            : tab === 'free' ? 'Немає вільних завдань'
                                : 'Завдань ще немає'}
                    </p>
                    {canManage && tab === 'all' && (
                        <button
                            onClick={() => setCreateModal(true)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all"
                        >
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
                            canManage={canManage}
                            currentUserId={user?.id ?? ''}
                            onComplete={() => setCompleteOrder(order)}
                            onDelete={() => handleDelete(order.id)}
                            onAssign={() => setAssignOrder(order)}
                            onStatusChange={status => handleStatusChange(order.id, status)}
                            onTake={() => handleTake(order.id)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && result && result.totalCount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.04] bg-[#0B0D14]/40 backdrop-blur-md shadow-lg">
                    <span className="text-xs text-slate-500 font-medium">
                        Сторінка {result.page} з {result.totalPages} · Всього: {result.totalCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!result.hasPreviousPage}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={13} /> Назад
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!result.hasNextPage}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30 transition-all"
                        >
                            Вперед <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}