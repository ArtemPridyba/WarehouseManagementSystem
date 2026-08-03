import { useEffect, useState } from 'react';
import {
    X, MapPin, Package, ArrowLeftRight,
    SlidersHorizontal, Loader2, Hash, Calendar, Building2, Layers,
} from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import type { ProductLocationItem, StockItem } from '../types';

interface Props {
    productId: string;
    productName: string;
    sku: string;
    onClose: () => void;
    onTransfer?: (item: StockItem) => void;
    onAdjust?: (item: StockItem) => void;
    canManage?: boolean;
}

export function ProductDetailDrawer({
                                        productId,
                                        productName,
                                        sku,
                                        onClose,
                                        onTransfer,
                                        onAdjust,
                                        canManage = false,
                                    }: Props) {
    const [locations, setLocations] = useState<ProductLocationItem[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        inventoryService.getProductLocations(productId)
            .then(data  => { if (mounted) setLocations(data); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [productId]);

    const totalQuantity = locations.reduce((sum, l) => sum + l.availableQuantity, 0);

    // Групуємо локації по складу для зручного відображення
    const byWarehouse = locations.reduce<Record<string, ProductLocationItem[]>>((acc, loc) => {
        const key = loc.warehouseName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(loc);
        return acc;
    }, {});

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
                    width: 420,
                    background: '#13151f',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                }}
            >
                {/* ── Header ── */}
                <div
                    className="flex items-start justify-between p-5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
                        >
                            <Package size={18} style={{ color: '#818cf8' }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>
                                {productName}
                            </p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: '#6366f1' }}>{sku}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 shrink-0 mt-0.5" style={{ color: '#475569' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* ── Stats ── */}
                <div
                    className="px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-lg px-3 py-2.5"
                            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}
                        >
                            <p className="text-xs mb-1" style={{ color: '#475569' }}>Всього на складі</p>
                            <p className="text-xl font-bold" style={{ color: '#2dd4bf' }}>{totalQuantity}</p>
                        </div>
                        <div
                            className="rounded-lg px-3 py-2.5"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            <p className="text-xs mb-1" style={{ color: '#475569' }}>Локацій</p>
                            <p className="text-xl font-bold" style={{ color: '#f1f5f9' }}>{locations.length}</p>
                        </div>
                    </div>
                </div>

                {/* ── Location list ── */}
                <div className="flex-1 overflow-y-auto p-5">
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
                        <div className="space-y-4">
                            {Object.entries(byWarehouse).map(([warehouseName, locs]) => (
                                <div key={warehouseName}>
                                    {/* Warehouse header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 size={13} style={{ color: '#6366f1' }} />
                                        <span className="text-xs font-semibold uppercase tracking-wide"
                                              style={{ color: '#6366f1' }}>
                                            {warehouseName}
                                        </span>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.15)' }} />
                                    </div>

                                    {/* Locations within warehouse */}
                                    <div className="space-y-2 pl-1">
                                        {locs.map((loc, i) => {
                                            const stockItem: StockItem = {
                                                productId,
                                                productName,
                                                sku,
                                                location:   loc.locationCode,
                                                locationId: loc.locationId,
                                                quantity:   loc.availableQuantity,
                                                batch:      loc.batchNumber !== 'No Batch' ? loc.batchNumber : undefined,
                                                batchId:    undefined,
                                                zoneName:   loc.zoneName,
                                                expiryDate: loc.expiryDate,
                                            };

                                            return (
                                                <div
                                                    key={i}
                                                    className="rounded-lg p-3"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid rgba(255,255,255,0.06)',
                                                    }}
                                                >
                                                    {/* Zone + Location + Quantity */}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {/* Zone */}
                                                            <div className="flex items-center gap-1.5">
                                                                <Layers size={11} style={{ color: '#475569' }} />
                                                                <span className="text-xs" style={{ color: '#64748b' }}>
                                                                    {loc.zoneName}
                                                                </span>
                                                            </div>
                                                            <span style={{ color: '#334155' }}>›</span>
                                                            {/* Location */}
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin size={12} style={{ color: '#6366f1' }} />
                                                                <span className="text-sm font-mono font-medium"
                                                                      style={{ color: '#f1f5f9' }}>
                                                                    {loc.locationCode}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-bold ml-2 shrink-0"
                                                              style={{ color: '#2dd4bf' }}>
                                                            {loc.availableQuantity} од.
                                                        </span>
                                                    </div>

                                                    {/* Batch + Expiry */}
                                                    {loc.batchNumber !== 'No Batch' && (
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Hash size={11} style={{ color: '#475569' }} />
                                                                <span className="text-xs font-mono"
                                                                      style={{ color: '#94a3b8' }}>
                                                                    {loc.batchNumber}
                                                                </span>
                                                            </div>
                                                            {loc.expiryDate && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar size={11} style={{ color: '#475569' }} />
                                                                    <span
                                                                        className="text-xs"
                                                                        style={{
                                                                            color: new Date(loc.expiryDate) < new Date()
                                                                                ? '#f87171'
                                                                                : '#94a3b8',
                                                                        }}
                                                                    >
                                                                        {new Date(loc.expiryDate).toLocaleDateString('uk-UA')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    {canManage && (onTransfer || onAdjust) && (
                                                        <div className="flex gap-2 mt-2">
                                                            {onTransfer && (
                                                                <button
                                                                    onClick={() => onTransfer(stockItem)}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium"
                                                                    style={{
                                                                        background: 'rgba(99,102,241,0.1)',
                                                                        color: '#818cf8',
                                                                        border: '1px solid rgba(99,102,241,0.2)',
                                                                    }}
                                                                >
                                                                    <ArrowLeftRight size={12} /> Перемістити
                                                                </button>
                                                            )}
                                                            {onAdjust && (
                                                                <button
                                                                    onClick={() => onAdjust(stockItem)}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium"
                                                                    style={{
                                                                        background: 'rgba(245,158,11,0.1)',
                                                                        color: '#f59e0b',
                                                                        border: '1px solid rgba(245,158,11,0.2)',
                                                                    }}
                                                                >
                                                                    <SlidersHorizontal size={12} /> Скоригувати
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg py-2.5 text-sm font-medium"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#94a3b8',
                        }}
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </>
    );
}