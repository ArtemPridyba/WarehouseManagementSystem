import { useEffect, useState } from 'react';
import {
    Boxes, Search, Loader2, X, ArrowLeftRight,
    SlidersHorizontal, MapPin, Package, AlertTriangle,
    ChevronRight, Calendar, Hash,
} from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { warehouseService } from '../services/warehouse.service';
import { productService } from '../services/product.service';
import { useRole } from '../hooks/useAuth';
import type {
    StockItem, ProductLocationItem, TransferRequest,
    AdjustmentRequest, WarehouseEntity, Product, LocationWithZone,
} from '../types';

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({ item, locations, onClose, onDone }: {
    item: StockItem;
    locations: LocationWithZone[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [form, setForm] = useState<TransferRequest>({
        productId: item.productId,
        fromLocationId: item.locationId,
        toLocationId: '',
        batchId: item.batchId || undefined,
        quantity: item.quantity,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableLocations = locations.filter(l => l.id !== item.locationId);
    const isValid = form.toLocationId && form.quantity > 0 && form.quantity <= item.quantity;

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await inventoryService.transfer(form);
            onDone();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка переміщення');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Переміщення товару
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                <div className="rounded-lg px-4 py-3 mb-5"
                     style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: '#a5b4fc' }}>{item.productName}</p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#475569' }}>
                        <span>SKU: <span style={{ color: '#94a3b8' }}>{item.sku}</span></span>
                        <span>З: <span style={{ color: '#94a3b8' }}>{item.location}</span></span>
                        <span>Доступно: <span style={{ color: '#94a3b8' }}>{item.quantity}</span></span>
                    </div>
                    {item.batch && (
                        <p className="text-xs mt-1" style={{ color: '#475569' }}>
                            Партія: <span style={{ color: '#94a3b8' }}>{item.batch}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Комірка призначення *
                        </label>
                        <select value={form.toLocationId}
                                onChange={e => setForm(p => ({ ...p, toLocationId: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            <option value="">— Оберіть комірку —</option>
                            {availableLocations.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.zoneName} → {l.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Кількість * (макс: {item.quantity})
                        </label>
                        <input type="number" min={0.001} step={0.001} max={item.quantity}
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
                                background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <ArrowLeftRight size={14} />
                        Перемістити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Adjust Modal ─────────────────────────────────────────────────────────────

function AdjustModal({ item, onClose, onDone }: {
    item: StockItem;
    onClose: () => void;
    onDone: () => void;
}) {
    const REASONS = ['Інвентаризація', 'Пошкодження товару', 'Пересортиця', 'Повернення', 'Списання браку', 'Інше'];
    const [form, setForm] = useState<AdjustmentRequest>({
        productId: item.productId,
        locationId: item.locationId,
        batchId: item.batchId || undefined,
        newQuantity: item.quantity,
        reason: REASONS[0],
    });
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const delta = form.newQuantity - item.quantity;
    const isValid = form.newQuantity >= 0 && (form.reason !== 'Інше' || customReason.trim());

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await inventoryService.adjust({ ...form, reason: form.reason === 'Інше' ? customReason : form.reason });
            onDone();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка коригування');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>Коригування залишків</h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                <div className="rounded-lg px-4 py-3 mb-5"
                     style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: '#fcd34d' }}>{item.productName}</p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#475569' }}>
                        <span>Комірка: <span style={{ color: '#94a3b8' }}>{item.location}</span></span>
                        <span>Поточно: <span style={{ color: '#94a3b8' }}>{item.quantity}</span></span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Нова кількість *</label>
                        <input type="number" min={0} step={0.001}
                               value={form.newQuantity}
                               onChange={e => setForm(p => ({ ...p, newQuantity: parseFloat(e.target.value) || 0 }))}
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                        {delta !== 0 && (
                            <p className="text-xs mt-1.5 flex items-center gap-1"
                               style={{ color: delta > 0 ? '#2dd4bf' : '#f87171' }}>
                                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} од. {delta > 0 ? 'додається' : 'списується'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Причина коригування *</label>
                        <select value={form.reason}
                                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {form.reason === 'Інше' && (
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>Вкажіть причину *</label>
                            <input value={customReason} onChange={e => setCustomReason(e.target.value)}
                                   placeholder="Опишіть причину..."
                                   className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                   onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                   onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                    )}
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
                        <SlidersHorizontal size={14} />
                        Скоригувати
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Product Detail Drawer ────────────────────────────────────────────────────

function ProductDetailDrawer({ product, onClose, onTransfer, onAdjust, canManage }: {
    product: Product;
    onClose: () => void;
    onTransfer: (item: StockItem) => void;
    onAdjust: (item: StockItem) => void;
    canManage: boolean;
}) {
    const [locations, setLocations] = useState<ProductLocationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        inventoryService.getProductLocations(product.id)
            .then(data => { if (mounted) setLocations(data); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [product.id]);

    const totalQuantity = locations.reduce((sum, l) => sum + l.availableQuantity, 0);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="fixed right-0 top-0 h-full z-50 flex flex-col"
                style={{
                    width: 400,
                    background: '#13151f',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                }}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                             style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <Package size={18} style={{ color: '#818cf8' }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>
                                {product.name}
                            </p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: '#6366f1' }}>
                                {product.sku}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 shrink-0 mt-0.5" style={{ color: '#475569' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Загальна кількість */}
                <div className="px-5 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg px-3 py-2.5"
                             style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}>
                            <p className="text-xs mb-1" style={{ color: '#475569' }}>Всього на складі</p>
                            <p className="text-xl font-bold" style={{ color: '#2dd4bf' }}>{totalQuantity}</p>
                        </div>
                        <div className="rounded-lg px-3 py-2.5"
                             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs mb-1" style={{ color: '#475569' }}>Локацій</p>
                            <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>{locations.length}</p>
                        </div>
                    </div>
                </div>

                {/* Список локацій */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-xs font-medium mb-3" style={{ color: '#475569' }}>
                        Розміщення на складі
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <MapPin size={28} style={{ color: '#1e293b' }} />
                            <p className="text-sm" style={{ color: '#334155' }}>Товар не знайдено на складі</p>
                        </div>
                    ) : (
                        locations.map((loc, i) => {
                            // Формуємо StockItem для модалів
                            const stockItem: StockItem = {
                                productId: product.id,
                                productName: product.name,
                                sku: product.sku,
                                location: loc.locationCode,
                                locationId: loc.locationId,
                                quantity: loc.availableQuantity,
                                batch: loc.batchNumber !== 'No Batch' ? loc.batchNumber : undefined,
                                batchId: undefined,
                                zoneName: undefined,
                                expiryDate: loc.expiryDate,
                            };

                            return (
                                <div key={i} className="rounded-lg p-3"
                                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

                                    {/* Локація + кількість */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={13} style={{ color: '#6366f1' }} />
                                            <span className="text-sm font-mono font-medium" style={{ color: '#f1f5f9' }}>
                                                {loc.locationCode}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: '#2dd4bf' }}>
                                            {loc.availableQuantity} од.
                                        </span>
                                    </div>

                                    {/* Партія та термін */}
                                    {loc.batchNumber !== 'No Batch' && (
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <Hash size={11} style={{ color: '#475569' }} />
                                                <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                                                    {loc.batchNumber}
                                                </span>
                                            </div>
                                            {loc.expiryDate && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={11} style={{ color: '#475569' }} />
                                                    <span className="text-xs"
                                                          style={{ color: new Date(loc.expiryDate) < new Date() ? '#f87171' : '#94a3b8' }}>
                                                        {new Date(loc.expiryDate).toLocaleDateString('uk-UA')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Кнопки дій */}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => { onClose(); onTransfer(stockItem); }}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium"
                                            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                                        >
                                            <ArrowLeftRight size={12} /> Перемістити
                                        </button>
                                        {canManage && (
                                            <button
                                                onClick={() => { onClose(); onAdjust(stockItem); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium"
                                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                                            >
                                                <SlidersHorizontal size={12} /> Скоригувати
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg py-2.5 text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { canManage } = useRole();
    const [warehouses, setWarehouses]           = useState<WarehouseEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [stock, setStock]                     = useState<StockItem[]>([]);
    const [allLocations, setAllLocations]       = useState<LocationWithZone[]>([]);
    const [products, setProducts]               = useState<Product[]>([]);
    const [loading, setLoading]                 = useState(false);
    const [search, setSearch]                   = useState('');
    const [transferItem, setTransferItem]       = useState<StockItem | null>(null);
    const [adjustItem, setAdjustItem]           = useState<StockItem | null>(null);
    const [detailProduct, setDetailProduct]     = useState<Product | null>(null);

    useEffect(() => {
        let mounted = true;
        Promise.all([warehouseService.getAll(), productService.getAll()])
            .then(([w, p]) => { if (mounted) { setWarehouses(w); setProducts(p); } });
        return () => { mounted = false; };
    }, []);

    async function loadStock(warehouseId: string) {
        setLoading(true);
        setSelectedWarehouse(warehouseId);
        try {
            const [stockData, zones] = await Promise.all([
                inventoryService.getStock(warehouseId),
                warehouseService.getZones(warehouseId),
            ]);
            setStock(stockData);

            const locs: LocationWithZone[] = [];
            for (const zone of zones) {
                const zoneLocs = await warehouseService.getLocations(zone.id);
                locs.push(...zoneLocs.map(l => ({ ...l, zoneName: zone.name })));
            }
            setAllLocations(locs);
        } finally {
            setLoading(false);
        }
    }

    async function refresh() {
        if (selectedWarehouse) await loadStock(selectedWarehouse);
    }

    const filtered = stock.filter(item =>
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.location?.toLowerCase().includes(search.toLowerCase())
    );

    const lowStock = stock.filter(s => s.quantity < 10).length;

    // Знаходимо Product об'єкт по productId з рядка таблиці
    function openDetail(item: StockItem) {
        const product = products.find(p => p.id === item.productId);
        if (product) setDetailProduct(product);
    }

    return (
        <div className="space-y-6">
            {/* Modals */}
            {transferItem && (
                <TransferModal
                    item={transferItem}
                    locations={allLocations}
                    onClose={() => setTransferItem(null)}
                    onDone={refresh}
                />
            )}
            {adjustItem && (
                <AdjustModal
                    item={adjustItem}
                    onClose={() => setAdjustItem(null)}
                    onDone={refresh}
                />
            )}
            {detailProduct && (
                <ProductDetailDrawer
                    product={detailProduct}
                    onClose={() => setDetailProduct(null)}
                    onTransfer={item => { setDetailProduct(null); setTransferItem(item); }}
                    onAdjust={item => { setDetailProduct(null); setAdjustItem(item); }}
                    canManage={canManage}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Інвентаризація</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>Залишки товарів на складі</p>
                </div>
                <div className="flex gap-2">
                    <select
                        onChange={e => {
                            const product = products.find(p => p.id === e.target.value);
                            if (product) setDetailProduct(product);
                        }}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                        value=""
                    >
                        <option value="" disabled>Де знаходиться товар?</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Low stock alert */}
            {lowStock > 0 && selectedWarehouse && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
                     style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <AlertTriangle size={16} style={{ color: '#f87171' }} />
                    <p className="text-sm" style={{ color: '#fca5a5' }}>
                        {lowStock} позицій з кількістю менше 10 одиниць
                    </p>
                </div>
            )}

            {/* Фільтри */}
            <div className="flex gap-3">
                <select
                    value={selectedWarehouse}
                    onChange={e => loadStock(e.target.value)}
                    className="rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: selectedWarehouse ? '#f1f5f9' : '#475569' }}
                >
                    <option value="">— Оберіть склад —</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>

                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Пошук за товаром, SKU або коміркою..."
                        className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none"
                        style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.4)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                </div>
            </div>

            {/* Таблиця */}
            {!selectedWarehouse ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Boxes size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>Оберіть склад для перегляду залишків</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Package size={32} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>
                        {search ? 'Нічого не знайдено' : 'Склад порожній'}
                    </p>
                </div>
            ) : (
                <div className="rounded-xl overflow-hidden"
                     style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

                    <div className="grid text-xs font-medium px-4 py-3"
                         style={{
                             gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                             background: '#13151f',
                             borderBottom: '1px solid rgba(255,255,255,0.06)',
                             color: '#475569',
                         }}>
                        <span>Товар</span>
                        <span>SKU</span>
                        <span>Комірка</span>
                        <span>Партія</span>
                        <span className="text-right">Кількість</span>
                        <span className="text-right">Дії</span>
                    </div>

                    {filtered.map((item, i) => (
                        <div
                            key={i}
                            className="grid items-center px-4 py-3 cursor-pointer"
                            style={{
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                                background: i % 2 === 0 ? '#13151f' : 'rgba(255,255,255,0.01)',
                                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#13151f' : 'rgba(255,255,255,0.01)')}
                            onClick={() => openDetail(item)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                     style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    <Package size={13} style={{ color: '#6366f1' }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                                        {item.productName}
                                    </p>
                                </div>
                                <ChevronRight size={13} style={{ color: '#334155', flexShrink: 0 }} />
                            </div>

                            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{item.sku}</span>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} style={{ color: '#6366f1' }} />
                                    <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{item.location}</span>
                                </div>
                                {item.zoneName && (
                                    <span className="text-xs ml-4" style={{ color: '#334155' }}>{item.zoneName}</span>
                                )}
                            </div>

                            <span className="text-xs font-mono" style={{ color: '#475569' }}>
                                {item.batch ?? '—'}
                            </span>

                            <span className="text-right text-sm font-semibold"
                                  style={{ color: item.quantity < 10 ? '#f87171' : '#f1f5f9' }}>
                                {item.quantity}
                            </span>

                            <div className="flex items-center justify-end gap-1"
                                 onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setTransferItem(item)}
                                    className="p-1.5 rounded-md"
                                    style={{ color: '#475569' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                                    title="Перемістити"
                                >
                                    <ArrowLeftRight size={14} />
                                </button>
                                {canManage && (
                                    <button
                                        onClick={() => setAdjustItem(item)}
                                        className="p-1.5 rounded-md"
                                        style={{ color: '#475569' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                                        title="Скоригувати залишки"
                                    >
                                        <SlidersHorizontal size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}