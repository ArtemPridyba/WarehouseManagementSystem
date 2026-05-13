import { useEffect, useState, useCallback } from 'react';
import {
    ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine,
    SlidersHorizontal, Loader2, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { warehouseService } from '../services/warehouse.service';
import type { InventoryTransactionItem, TransactionType, PagedResult } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<TransactionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    Inbound:    { label: 'Прихід',        color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',  icon: <ArrowDownToLine size={13} /> },
    Outbound:   { label: 'Відвантаження', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: <ArrowUpFromLine size={13} /> },
    Transfer:   { label: 'Переміщення',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: <ArrowLeftRight size={13} /> },
    Adjustment: { label: 'Коригування',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <SlidersHorizontal size={13} /> },
};

function TypeBadge({ type }: { type: TransactionType }) {
    const m = TYPE_META[type] ?? { label: type, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: null };
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: m.bg, color: m.color }}
        >
      {m.icon}{m.label}
    </span>
    );
}

function LocationCell({ location, zone }: { location: string | null; zone: string | null }) {
    if (!location) return <span style={{ color: '#334155' }}>—</span>;
    return (
        <div>
            <span className="font-mono text-xs" style={{ color: '#f1f5f9' }}>{location}</span>
            {zone && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{zone}</p>}
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const TYPES = [
    { value: '',           label: 'Всі типи' },
    { value: 'Inbound',    label: 'Прихід' },
    { value: 'Outbound',   label: 'Відвантаження' },
    { value: 'Transfer',   label: 'Переміщення' },
    { value: 'Adjustment', label: 'Коригування' },
];

const selectStyle: React.CSSProperties = {
    background: '#1e2130',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    outline: 'none',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionHistoryPage() {
    const [result, setResult]   = useState<PagedResult<InventoryTransactionItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage]       = useState(1);

    const [warehouses, setWarehouses]     = useState<{ id: string; name: string }[]>([]);
    const [warehouseId, setWarehouseId]   = useState('');
    const [type, setType]                 = useState('');
    const [from, setFrom]                 = useState('');
    const [to, setTo]                     = useState('');

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

    function handlePageChange(next: number) {
        setPage(next);
        load(next);
    }

    function handleReset() {
        setWarehouseId('');
        setType('');
        setFrom('');
        setTo('');
    }

    const rows = result?.items ?? [];

    return (
        <div className="space-y-5">

            {/* Заголовок */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Історія операцій</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
                        Всі транзакції інвентарю
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                    <RotateCcw size={14} /> Скинути
                </button>
            </div>

            {/* Фільтри */}
            <div
                className="rounded-xl p-4 flex flex-wrap gap-3 items-end"
                style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#475569' }}>Склад</label>
                    <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} style={selectStyle}>
                        <option value="">Всі склади</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#475569' }}>Тип операції</label>
                    <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#475569' }}>Від</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={selectStyle} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#475569' }}>До</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} style={selectStyle} />
                </div>
            </div>

            {/* Таблиця */}
            <div
                className="rounded-xl overflow-hidden"
                style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                        <ArrowLeftRight size={32} style={{ color: '#1e293b' }} />
                        <p className="text-sm" style={{ color: '#334155' }}>Операцій не знайдено</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Дата', 'Тип', 'Товар', 'SKU', 'З локації', 'До локації', 'Кількість', 'Партія', 'Референс'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: '#334155' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row, i) => (
                                <tr
                                    key={row.id}
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div style={{ color: '#94a3b8' }}>
                                            {new Date(row.createdAt).toLocaleDateString('uk-UA')}
                                        </div>
                                        <div className="text-xs mt-0.5" style={{ color: '#334155' }}>
                                            {new Date(row.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <TypeBadge type={row.type} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium" style={{ color: '#f1f5f9' }}>{row.productName}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs" style={{ color: '#6366f1' }}>{row.sku}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <LocationCell location={row.fromLocation} zone={row.fromZone} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <LocationCell location={row.toLocation} zone={row.toZone} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold" style={{ color: row.quantity >= 0 ? '#2dd4bf' : '#f87171' }}>
                        {row.quantity >= 0 ? '+' : ''}{row.quantity}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {row.batchNumber
                                            ? <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>{row.batchNumber}</span>
                                            : <span style={{ color: '#334155' }}>—</span>}
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-xs truncate block" style={{ color: '#475569' }}>
                        {row.reference ?? '—'}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Пагінація */}
                {!loading && result && result.totalCount > 0 && (
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
            <span className="text-xs" style={{ color: '#334155' }}>
              Сторінка {result.page} з {result.totalPages} · Всього: {result.totalCount}
            </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={!result.hasPreviousPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-30"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                            >
                                <ChevronLeft size={13} /> Назад
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={!result.hasNextPage}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-30"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                            >
                                Вперед <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}