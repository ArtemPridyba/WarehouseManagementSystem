import { useEffect, useState } from 'react';
import {
    Boxes, Search, Loader2, X, ArrowLeftRight,
    SlidersHorizontal, MapPin, Package, AlertTriangle,
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

                {/* Info */}
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
    const REASONS = [
        'Інвентаризація',
        'Пошкодження товару',
        'Пересортиця',
        'Повернення',
        'Списання браку',
        'Інше',
    ];

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
            await inventoryService.adjust({
                ...form,
                reason: form.reason === 'Інше' ? customReason : form.reason,
            });
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
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Коригування залишків
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {/* Info */}
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
                    {/* Нова кількість */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Нова кількість *
                        </label>
                        <input type="number" min={0} step={0.001}
                               value={form.newQuantity}
                               onChange={e => setForm(p => ({ ...p, newQuantity: parseFloat(e.target.value) || 0 }))}
                               className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                               onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                               onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                        {/* Delta indicator */}
                        {delta !== 0 && (
                            <p className="text-xs mt-1.5 flex items-center gap-1"
                               style={{ color: delta > 0 ? '#2dd4bf' : '#f87171' }}>
                                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} од. {delta > 0 ? 'додається' : 'списується'}
                            </p>
                        )}
                    </div>

                    {/* Причина */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Причина коригування *
                        </label>
                        <select value={form.reason}
                                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Власна причина */}
                    {form.reason === 'Інше' && (
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Вкажіть причину *
                            </label>
                            <input
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder="Опишіть причину коригування..."
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

// ─── Product Locations Modal ──────────────────────────────────────────────────

function ProductLocationsModal({ product, onClose }: {
    product: Product;
    onClose: () => void;
}) {
    const [locations, setLocations] = useState<ProductLocationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        inventoryService.getProductLocations(product.id)
            .then(setLocations)
            .finally(() => setLoading(false));
    }, [product.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                            Де знаходиться товар
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{product.name}</p>
                    </div>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

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
                    <div className="space-y-2">
                        {locations.map((loc, i) => (
                            <div key={i} className="rounded-lg px-4 py-3"
                                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={13} style={{ color: '#6366f1' }} />
                                        <span className="text-sm font-mono font-medium" style={{ color: '#f1f5f9' }}>
                      {loc.locationCode}
                    </span>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: '#2dd4bf' }}>
                    {loc.availableQuantity} од.
                  </span>
                                </div>
                                {loc.batchNumber !== 'No Batch' && (
                                    <div className="flex items-center justify-between text-xs" style={{ color: '#475569' }}>
                                        <span>Партія: <span style={{ color: '#94a3b8' }}>{loc.batchNumber}</span></span>
                                        {loc.expiryDate && (
                                            <span>До: <span style={{ color: '#94a3b8' }}>
                        {new Date(loc.expiryDate).toLocaleDateString('uk-UA')}
                      </span></span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={onClose}
                        className="w-full mt-5 rounded-lg py-2.5 text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    Закрити
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { isAdmin } = useRole();
    const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [stock, setStock] = useState<StockItem[]>([]);
    const [allLocations, setAllLocations] = useState<LocationWithZone[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [transferItem, setTransferItem] = useState<StockItem | null>(null);
    const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
    const [locationProduct, setLocationProduct] = useState<Product | null>(null);

    // Завантаження складів і товарів
    useEffect(() => {
        Promise.all([warehouseService.getAll(), productService.getAll()])
            .then(([w, p]) => { setWarehouses(w); setProducts(p); });
    }, []);

    // Завантаження залишків при виборі складу
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
            {locationProduct && (
                <ProductLocationsModal
                    product={locationProduct}
                    onClose={() => setLocationProduct(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Інвентаризація</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>
                        Залишки товарів на складі
                    </p>
                </div>

                {/* Пошук товару по локаціях */}
                <div className="flex gap-2">
                    <select
                        onChange={e => {
                            const product = products.find(p => p.id === e.target.value);
                            if (product) setLocationProduct(product);
                        }}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                        value=""
                    >
                        <option value="" disabled>🔍 Де знаходиться товар?</option>
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
                        placeholder="Пошук за товаром, SKU або комірною..."
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

                    {/* Header */}
                    <div className="grid text-xs font-medium px-4 py-3"
                         style={{
                             gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
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
                        <div key={i} className="grid items-center px-4 py-3"
                             style={{
                                 gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                                 background: i % 2 === 0 ? '#13151f' : 'rgba(255,255,255,0.01)',
                                 borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                             }}>

                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                     style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    <Package size={13} style={{ color: '#6366f1' }} />
                                </div>
                                <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                                    {item.productName}
                                </p>
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

                            <div className="flex items-center justify-end gap-1">
                                <button
                                    onClick={() => setTransferItem(item)}
                                    className="p-1.5 rounded-md transition-colors"
                                    style={{ color: '#475569' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                                    title="Перемістити"
                                >
                                    <ArrowLeftRight size={14} />
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setAdjustItem(item)}
                                        className="p-1.5 rounded-md transition-colors"
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