import { useEffect, useState, useCallback, useRef } from 'react';
import {
    ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine,
    SlidersHorizontal, Loader2, RotateCcw, ChevronLeft, ChevronRight,
    ChevronDown,
} from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { warehouseService } from '../services/warehouse.service';
import type { InventoryTransactionItem, TransactionType, PagedResult } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<TransactionType, { label: string; className: string; icon: React.ReactNode }> = {
    Inbound:    { label: 'Прихід',        className: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',       icon: <ArrowDownToLine size={12} /> },
    Outbound:   { label: 'Відвантаження', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',       icon: <ArrowUpFromLine size={12} /> },
    Transfer:   { label: 'Переміщення',   className: 'bg-violet-500/10 text-violet-400 border border-violet-500/20', icon: <ArrowLeftRight size={12} /> },
    Adjustment: { label: 'Коригування',   className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',    icon: <SlidersHorizontal size={12} /> },
};

function TypeBadge({ type }: { type: TransactionType }) {
    const m = TYPE_META[type] ?? { label: type, className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.className}`}>
            {m.icon}{m.label}
        </span>
    );
}

function LocationCell({ location, zone }: { location: string | null; zone: string | null }) {
    if (!location) return <span className="text-slate-600">—</span>;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-medium text-slate-300">{location}</span>
            {zone && <p className="text-[11px] text-slate-500">{zone}</p>}
        </div>
    );
}

// ─── Custom scrollbar ─────────────────────────────────────────────────────────

function CustomScrollbar({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
    const trackRef  = useRef<HTMLDivElement>(null);
    const thumbRef  = useRef<HTMLDivElement>(null);
    const dragging  = useRef(false);
    const startX    = useRef(0);
    const startLeft = useRef(0);

    const [thumbStyle, setThumbStyle] = useState({ left: 0, width: 0 });
    const [visible, setVisible]       = useState(false);

    const recalc = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ratio      = el.clientWidth / el.scrollWidth;
        const trackWidth = trackRef.current?.clientWidth ?? el.clientWidth;
        const thumbW     = Math.max(ratio * trackWidth, 40);
        const maxScroll  = el.scrollWidth - el.clientWidth;
        const left       = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (trackWidth - thumbW) : 0;
        setThumbStyle({ left, width: thumbW });
        setVisible(ratio < 0.9999);
    }, [scrollRef]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', recalc);
        const ro = new ResizeObserver(recalc);
        ro.observe(el);
        recalc();
        return () => { el.removeEventListener('scroll', recalc); ro.disconnect(); };
    }, [scrollRef, recalc]);

    function onThumbMouseDown(e: React.MouseEvent) {
        e.preventDefault();
        dragging.current  = true;
        startX.current    = e.clientX;
        startLeft.current = thumbStyle.left;

        function onMove(ev: MouseEvent) {
            if (!dragging.current) return;
            const el    = scrollRef.current;
            const track = trackRef.current;
            if (!el || !track) return;
            const trackW  = track.clientWidth;
            const thumbW  = thumbStyle.width;
            const dx      = ev.clientX - startX.current;
            const newLeft = Math.max(0, Math.min(startLeft.current + dx, trackW - thumbW));
            el.scrollLeft = (newLeft / (trackW - thumbW)) * (el.scrollWidth - el.clientWidth);
        }
        function onUp() {
            dragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    function onTrackClick(e: React.MouseEvent) {
        if ((e.target as HTMLElement) === thumbRef.current) return;
        const el    = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect   = track.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio  = (clickX - thumbStyle.width / 2) / (track.clientWidth - thumbStyle.width);
        el.scrollLeft = Math.max(0, Math.min(ratio, 1)) * (el.scrollWidth - el.clientWidth);
    }

    if (!visible) return null;

    return (
        <div
            ref={trackRef}
            onClick={onTrackClick}
            className="mx-4 mb-3 mt-1 h-[5px] rounded-full relative cursor-pointer select-none"
            style={{ background: 'rgba(255,255,255,0.04)' }}
        >
            <div
                ref={thumbRef}
                onMouseDown={onThumbMouseDown}
                className="absolute top-0 h-full rounded-full cursor-grab active:cursor-grabbing transition-colors"
                style={{ left: thumbStyle.left, width: thumbStyle.width, background: 'rgba(99,102,241,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.5)')}
            />
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

const TYPES = [
    { value: '',           label: 'Всі типи' },
    { value: 'Inbound',    label: 'Прихід' },
    { value: 'Outbound',   label: 'Відвантаження' },
    { value: 'Transfer',   label: 'Переміщення' },
    { value: 'Adjustment', label: 'Коригування' },
];

const filterInputClass = "w-full rounded-lg px-3 py-2 text-sm bg-[#0B0D14]/60 border border-white/[0.08] text-slate-200 outline-none transition-all focus:border-indigo-500/50 cursor-pointer";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionHistoryPage() {
    const [result, setResult]   = useState<PagedResult<InventoryTransactionItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage]       = useState(1);

    const [warehouses, setWarehouses]   = useState<{ id: string; name: string }[]>([]);
    const [warehouseId, setWarehouseId] = useState('');
    const [type, setType]               = useState('');
    const [from, setFrom]               = useState('');
    const [to, setTo]                   = useState('');

    const [whOpen, setWhOpen]     = useState(false);
    const [typeOpen, setTypeOpen] = useState(false);
    const whRef   = useRef<HTMLDivElement>(null);
    const typeRef = useRef<HTMLDivElement>(null);
    const tableScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (whRef.current   && !whRef.current.contains(e.target as Node))   setWhOpen(false);
            if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let mounted = true;
        warehouseService.getAll().then(data => { if (mounted) setWarehouses(data); }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    const load = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await inventoryService.getTransactions({
                warehouseId: warehouseId || undefined,
                type:        type        || undefined,
                from:        from        || undefined,
                to:          to          || undefined,
                page:        p,
                pageSize:    PAGE_SIZE,
            });
            setResult(data);
        } catch {
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [warehouseId, type, from, to]);

    useEffect(() => {
        let mounted = true;
        setPage(1);
        load(1).then(() => { if (!mounted) return; });
        return () => { mounted = false; };
    }, [load]);

    function handlePageChange(next: number) { setPage(next); load(next); }
    function handleReset() { setWarehouseId(''); setType(''); setFrom(''); setTo(''); }

    const rows = result?.items ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <ArrowLeftRight size={22} className="text-indigo-400" />
                        Історія операцій
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Повний аудит транзакцій та рухів інвентарю</p>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-100"
                >
                    <RotateCcw size={14} /> Скинути фільтри
                </button>
            </div>

            {/* Фільтри */}
            <div className="relative z-20 rounded-xl p-4 flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-[#0B0D14]/40 border border-white/[0.06] shadow-md backdrop-blur-md">

                {/* Склад */}
                <div className="relative flex-1 min-w-[160px]" ref={whRef}>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Склад</label>
                    <button type="button"
                            onClick={() => { setWhOpen(!whOpen); setTypeOpen(false); }}
                            className={`${filterInputClass} flex items-center justify-between`}>
                        <span className={warehouseId ? 'text-slate-200' : 'text-slate-500'}>
                            {warehouses.find(w => w.id === warehouseId)?.name || 'Всі склади'}
                        </span>
                        <ChevronDown size={14} className="text-slate-500 shrink-0 ml-2" />
                    </button>
                    {whOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-full min-w-[200px] rounded-xl border border-white/[0.08] bg-[#11131C] shadow-2xl p-1 max-h-60 overflow-y-auto">
                            <button onClick={() => { setWarehouseId(''); setWhOpen(false); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.03] text-slate-300">
                                Всі склади
                            </button>
                            {warehouses.map(w => (
                                <button key={w.id} onClick={() => { setWarehouseId(w.id); setWhOpen(false); }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.03] text-slate-300">
                                    {w.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Тип */}
                <div className="relative flex-1 min-w-[160px]" ref={typeRef}>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Тип операції</label>
                    <button type="button"
                            onClick={() => { setTypeOpen(!typeOpen); setWhOpen(false); }}
                            className={`${filterInputClass} flex items-center justify-between`}>
                        <span className={type ? 'text-slate-200' : 'text-slate-500'}>
                            {TYPES.find(t => t.value === type)?.label || 'Всі типи'}
                        </span>
                        <ChevronDown size={14} className="text-slate-500 shrink-0 ml-2" />
                    </button>
                    {typeOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-full min-w-[200px] rounded-xl border border-white/[0.08] bg-[#11131C] shadow-2xl p-1">
                            {TYPES.map(t => (
                                <button key={t.value} onClick={() => { setType(t.value); setTypeOpen(false); }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/[0.03] text-slate-300">
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Дати */}
                <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Період від</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                           className={`${filterInputClass} [color-scheme:dark]`} />
                </div>
                <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">До</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                           className={`${filterInputClass} [color-scheme:dark]`} />
                </div>
            </div>

            {/* Таблиця */}
            <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0B0D14]/40 backdrop-blur-md shadow-lg">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <p className="text-sm text-slate-500 animate-pulse">Завантаження транзакцій...</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-slate-600">
                            <ArrowLeftRight size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">Жодних операцій за обраними фільтрами не знайдено</p>
                    </div>
                ) : (
                    <>
                        {/* Нативний скролбар прихований — замінений кастомним */}
                        <div
                            ref={tableScrollRef}
                            className="overflow-x-auto"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            <style>{`.hide-native-scroll::-webkit-scrollbar { display: none; }`}</style>
                            <div className="hide-native-scroll">
                                <table className="w-full text-sm border-collapse" style={{ minWidth: 720 }}>
                                    <thead>
                                    <tr className="bg-[#0B0D14]/80 border-b border-white/[0.04] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="text-left px-3 py-3 whitespace-nowrap">Дата / Час</th>
                                        <th className="text-left px-3 py-3">Тип</th>
                                        <th className="text-left px-3 py-3">Товар / SKU</th>
                                        <th className="text-left px-3 py-3">З локації</th>
                                        <th className="text-left px-3 py-3">До локації</th>
                                        <th className="text-right px-3 py-3 whitespace-nowrap">К-сть</th>
                                        <th className="text-left px-3 py-3">Партія</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                    {rows.map(row => (
                                        <tr key={row.id}
                                            className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.015] transition-colors">

                                            {/* Дата */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <div className="text-sm text-slate-300 font-medium">
                                                    {new Date(row.createdAt).toLocaleDateString('uk-UA')}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {new Date(row.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            {/* Тип */}
                                            <td className="px-3 py-3">
                                                <TypeBadge type={row.type} />
                                            </td>

                                            {/* Товар + SKU об'єднано */}
                                            <td className="px-3 py-3" style={{ maxWidth: 200 }}>
                                                <p className="font-medium text-slate-200 truncate text-sm">{row.productName}</p>
                                                <span className="font-mono text-[11px] text-indigo-400">{row.sku}</span>
                                            </td>

                                            {/* З локації */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <LocationCell location={row.fromLocation} zone={row.fromZone} />
                                            </td>

                                            {/* До локації */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <LocationCell location={row.toLocation} zone={row.toZone} />
                                            </td>

                                            {/* К-сть */}
                                            <td className="px-3 py-3 whitespace-nowrap text-right">
                                                    <span className={`text-sm font-bold ${row.quantity >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                                                        {row.quantity >= 0 ? '+' : ''}{row.quantity}
                                                    </span>
                                            </td>

                                            {/* Партія */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                {row.batchNumber
                                                    ? <span className="font-mono text-xs text-slate-400 bg-white/[0.02] px-1.5 py-0.5 rounded">{row.batchNumber}</span>
                                                    : <span className="text-slate-600">—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Кастомний скролбар */}
                        <CustomScrollbar scrollRef={tableScrollRef} />
                    </>
                )}

                {/* Пагінація */}
                {!loading && result && result.totalCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04] bg-[#0B0D14]/20">
                        <span className="text-xs text-slate-500 font-medium">
                            Сторінка {result.page} з {result.totalPages} · Всього: {result.totalCount}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={!result.hasPreviousPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">
                                <ChevronLeft size={13} /> Назад
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={!result.hasNextPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] disabled:opacity-30">
                                Вперед <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}