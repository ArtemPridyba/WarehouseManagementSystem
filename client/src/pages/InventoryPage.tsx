import { useEffect, useState, useRef } from 'react';
import {
    Boxes, Search, Loader2, X, ArrowLeftRight,
    SlidersHorizontal, MapPin, Package, AlertTriangle,
    ChevronLeft, ChevronRight, Download, ChevronDown
} from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { warehouseService } from '../services/warehouse.service';
import { productService } from '../services/product.service';
import { useRole } from '../hooks/useAuth';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { exportToCsv } from '../utils/exportCsv';
import { useProductDrawer } from '../context/ProductDrawerContext';
import type {
    StockItem, TransferRequest,
    AdjustmentRequest, WarehouseEntity, Product, LocationWithZone,
} from '../types';

const PAGE_SIZE = 6;

// ── Перевикористовувані классы ───────────────────────────────────────────────

const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-[#0B0D14]/60";
const selectClass = "w-full rounded-lg px-3 py-2.5 text-sm bg-[#11131C] border border-white/[0.08] text-slate-100 outline-none transition-all focus:border-indigo-500/50 cursor-pointer";

// ── TransferModal ───────────────────────────────────────────────────────────

function TransferModal({ item, locations, onClose, onDone }: {
    item: StockItem;
    locations: LocationWithZone[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [form, setForm] = useState<TransferRequest>({
        productId:      item.productId,
        fromLocationId: item.locationId,
        toLocationId:   '',
        batchId:        item.batchId || undefined,
        quantity:       item.quantity,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl p-6 bg-[#11131C] border border-white/[0.08] shadow-2xl">

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-100">Переміщення товару</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
                </div>

                <div className="rounded-lg px-4 py-3 mb-5 bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-sm font-medium mb-1 text-indigo-300">{item.productName}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>SKU: <span className="text-slate-300">{item.sku}</span></span>
                        <span>З: <span className="text-slate-300 font-mono">{item.location}</span></span>
                        <span>Доступно: <span className="text-teal-400 font-medium">{item.quantity}</span></span>
                    </div>
                    {item.batch && (
                        <p className="text-xs mt-1.5 text-slate-500">
                            Партія: <span className="text-slate-300 font-mono">{item.batch}</span>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Комірка призначення *</label>
                        <select value={form.toLocationId}
                                onChange={e => setForm(p => ({ ...p, toLocationId: e.target.value }))}
                                className={selectClass}>
                            <option value="" className="bg-[#11131C] text-slate-500">— Оберіть комірку —</option>
                            {availableLocations.map(l => (
                                <option key={l.id} value={l.id} className="bg-[#11131C]">{l.zoneName} → {l.code}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Кількість * <span className="font-normal text-slate-500">(макс: {item.quantity})</span>
                        </label>
                        <input type="number" min={0.001} step={0.001} max={item.quantity}
                               value={form.quantity}
                               onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                               className={`${inputClass} ${form.quantity > item.quantity ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all">
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/30 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/10">
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <ArrowLeftRight size={14} />
                        Перемістити
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── AdjustModal ─────────────────────────────────────────────────────────────

function AdjustModal({ item, onClose, onDone }: {
    item: StockItem;
    onClose: () => void;
    onDone: () => void;
}) {
    const REASONS = ['Інвентаризація', 'Пошкодження товару', 'Пересортиця', 'Повернення', 'Списання браку', 'Інше'];
    const [form, setForm] = useState<AdjustmentRequest>({
        productId:   item.productId,
        locationId:  item.locationId,
        batchId:     item.batchId || undefined,
        newQuantity: item.quantity,
        reason:      REASONS[0],
    });
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);

    const delta   = form.newQuantity - item.quantity;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl p-6 bg-[#11131C] border border-white/[0.08] shadow-2xl">

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-100">Коригування залишків</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
                </div>

                <div className="rounded-lg px-4 py-3 mb-5 bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium mb-1 text-amber-300">{item.productName}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Комірка: <span className="text-slate-300 font-mono">{item.location}</span></span>
                        <span>Поточно: <span className="text-amber-400 font-medium">{item.quantity}</span></span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Нова кількість *</label>
                        <input type="number" min={0} step={0.001}
                               value={form.newQuantity}
                               onChange={e => setForm(p => ({ ...p, newQuantity: parseFloat(e.target.value) || 0 }))}
                               className={inputClass}
                        />
                        {delta !== 0 && (
                            <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${delta > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} од. {delta > 0 ? 'додається' : 'списується'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Причина коригування *</label>
                        <select value={form.reason}
                                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                className={selectClass}>
                            {RECOGNIZED_REASONS.map(r => <option key={r} value={r} className="bg-[#11131C]">{r}</option>)}
                        </select>
                    </div>
                    {form.reason === 'Інше' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Вкажіть причину *</label>
                            <input value={customReason} onChange={e => setCustomReason(e.target.value)}
                                   placeholder="Опишіть причину..."
                                   className={inputClass}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-all">
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !isValid}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/10">
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        <SlidersHorizontal size={14} />
                        Скоригувати
                    </button>
                </div>
            </div>
        </div>
    );
}

// Тимчасовий фікс для масиву причин всередині компонента
const RECOGNIZED_REASONS = ['Інвентаризація', 'Пошкодження товару', 'Пересортиця', 'Повернення', 'Списання браку', 'Інше'];

// ── Main page ───────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { canManage }         = useRole();
    const { openProductDrawer } = useProductDrawer();

    const [warehouses, setWarehouses]               = useState<WarehouseEntity[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [stock, setStock]                         = useState<StockItem[]>([]);
    const [allLocations, setAllLocations]           = useState<LocationWithZone[]>([]);
    const [products, setProducts]                   = useState<Product[]>([]);
    const [loading, setLoading]                     = useState(false);
    const [search, setSearch]                       = useState('');
    const [transferItem, setTransferItem]           = useState<StockItem | null>(null);
    const [adjustItem, setAdjustItem]               = useState<StockItem | null>(null);

    // Стейт для пагінації
    const [page, setPage]                           = useState(1);

    // Стейт для кастомного селектора склада
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        Promise.all([warehouseService.getAll(), productService.getAll()])
            .then(([w, p]) => { if (mounted) { setWarehouses(w); setProducts(p); } });
        return () => { mounted = false; };
    }, []);

    // Закриття кастомного селектора по кліку зовні
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Скидання сторінки на першу у разі зміни параметрів пошуку чи складу
    useEffect(() => {
        setPage(1);
    }, [search, selectedWarehouse]);

    async function loadStock(warehouseId: string) {
        setLoading(true);
        setSelectedWarehouse(warehouseId);
        setDropdownOpen(false);
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

    useBarcodeScanner({
        enabled: !transferItem && !adjustItem,
        onScan: (barcode) => {
            const found = stock.find(s => s.sku?.toLowerCase() === barcode.toLowerCase());
            if (found) {
                const product = products.find(p => p.id === found.productId);
                if (product) openProductDrawer(product.id, product.name, product.sku);
            } else {
                setSearch(barcode);
            }
        },
    });

    function handleExportStock() {
        exportToCsv('inventory', filtered.map(item => ({
            'Товар':     item.productName,
            'SKU':       item.sku,
            'Комірка':   item.location,
            'Зона':      item.zoneName ?? '',
            'Партія':    item.batch ?? '',
            'Кількість': item.quantity,
        })));
    }

    const filtered = stock.filter(item =>
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.location?.toLowerCase().includes(search.toLowerCase())
    );

    // Розрахунок пагінації для поточного відфільтрованого списку
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;
    const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const lowStock = stock.filter(item => {
        const product = products.find(p => p.id === item.productId);
        return product && product.minStock > 0 && item.quantity < product.minStock;
    }).length;

    const activeWarehouseName = warehouses.find(w => w.id === selectedWarehouse)?.name;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {transferItem && (
                <TransferModal item={transferItem} locations={allLocations}
                               onClose={() => setTransferItem(null)} onDone={refresh} />
            )}
            {adjustItem && (
                <AdjustModal item={adjustItem}
                             onClose={() => setAdjustItem(null)} onDone={refresh} />
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Boxes size={22} className="text-indigo-400" />
                        Інвентаризація
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Поточні залишки товарів на складі</p>
                </div>
                <button
                    onClick={handleExportStock}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-100 disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                    title="Експортувати в CSV"
                >
                    <Download size={15} /> Експорт CSV
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.08] text-left outline-none transition-all focus:border-indigo-500/50"
                    >
                    <span className={selectedWarehouse ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                        {activeWarehouseName || '— Оберіть склад —'}
                    </span>
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-xl border border-white/[0.08] bg-[#11131C] shadow-2xl p-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto">
                            <button
                                onClick={() => { setSelectedWarehouse(''); setStock([]); setDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-white/[0.03] transition-colors"
                            >
                                — Скинути вибір —
                            </button>
                            {warehouses.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => loadStock(w.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                                        selectedWarehouse === w.id
                                            ? 'bg-indigo-600/20 text-indigo-400 font-medium border-l-2 border-indigo-500'
                                            : 'text-slate-300 hover:bg-white/[0.04] hover:text-slate-100'
                                    }`}
                                >
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Пошук за назвою, SKU або коміркою (Enter після сканування)..."
                        className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500/50 focus:bg-[#0B0D14] bg-[#0B0D14]/60 backdrop-blur-md border border-white/[0.08] text-slate-100 placeholder-slate-500"
                    />
                </div>
            </div>

            {/* ── Content ── */}
            {!selectedWarehouse ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-xl border border-white/[0.04] bg-[#0B0D14]/20 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-slate-600 shadow-inner">
                        <Boxes size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-400">Оберіть склад для перегляду залишків</p>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500 animate-pulse">Завантаження залишків...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* ── Low stock warning ── */}
                    {lowStock > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                            <p className="text-sm font-medium text-rose-300">
                                {lowStock} {lowStock === 1 ? 'позиція' : lowStock >= 2 && lowStock <= 4 ? 'позиції' : 'позицій'} нижче мінімального залишку
                            </p>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-xl border border-white/[0.04] bg-[#0B0D14]/20 backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-slate-600 shadow-inner">
                                <Package size={24} />
                            </div>
                            <p className="text-sm font-medium text-slate-400">
                                {search ? 'За вашим запитом нічого не знайдено' : 'На цьому складі немає товарів'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0B0D14]/40 backdrop-blur-md shadow-lg">
                            {/* Table Header */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] items-center text-xs font-semibold px-4 py-3 bg-[#0B0D14]/80 border-b border-white/[0.04] text-slate-400 uppercase tracking-wider">
                                <span>Товар</span>
                                <span>SKU</span>
                                <span>Комірка / Зона</span>
                                <span>Партія</span>
                                <span className="text-right">Кількість</span>
                                <span className="text-right">Дії</span>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-white/[0.02]">
                                {pagedItems.map((item, i) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const isLow   = product && product.minStock > 0 && item.quantity < product.minStock;

                                    return (
                                        <div key={i}
                                             className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] items-center px-4 py-3 cursor-pointer group transition-colors hover:bg-white/[0.02]"
                                             onClick={() => openProductDrawer(item.productId, item.productName, item.sku)}>
                                            <div className="flex items-center gap-3 min-w-0 pr-4">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                                                    <Package size={14} />
                                                </div>
                                                <p className="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">
                                                    {item.productName}
                                                </p>
                                                <ChevronRight size={14} className="text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors ml-auto" />
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 pr-2">{item.sku}</span>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-indigo-400 shrink-0" />
                                                    <span className="text-xs font-mono font-medium text-slate-300">{item.location}</span>
                                                </div>
                                                {item.zoneName && <span className="text-[11px] ml-4 text-slate-500">{item.zoneName}</span>}
                                            </div>
                                            <span className="text-xs font-mono text-slate-500">{item.batch ?? '—'}</span>
                                            <div className="text-right pr-2">
                                                <span className={`text-sm font-bold tracking-tight ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>{item.quantity}</span>
                                                {isLow && product && <p className="text-[10px] font-medium text-rose-500/80 mt-0.5">мін: {product.minStock}</p>}
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                {canManage && (
                                                    <>
                                                        <button onClick={() => setTransferItem(item)} className="p-1.5 rounded-lg text-slate-500 bg-transparent hover:text-indigo-400 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20" title="Перемістити товар"><ArrowLeftRight size={15} /></button>
                                                        <button onClick={() => setAdjustItem(item)} className="p-1.5 rounded-lg text-slate-500 bg-transparent hover:text-amber-400 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20" title="Скоригувати залишки"><SlidersHorizontal size={15} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalCount > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04] bg-[#0B0D14]/20">
                                    <span className="text-xs text-slate-500 font-medium">
                                        Сторінка {page} з {totalPages || 1} · Всього: {totalCount}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                                            disabled={!hasPreviousPage}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30 transition-all"
                                        >
                                            <ChevronLeft size={13} /> Назад
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                            disabled={!hasNextPage}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30 transition-all"
                                        >
                                            Вперед <ChevronRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}