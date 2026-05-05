import { useEffect, useState } from 'react';
import {
    Warehouse, Layers, MapPin, Plus, Pencil,
    Trash2, Loader2, X, ChevronRight, ChevronDown,
} from 'lucide-react';
import { warehouseService } from '../services/warehouse.service';
import { useRole } from '../hooks/useAuth';
import type {
    WarehouseEntity, ZoneEntity, LocationEntity,
    CreateWarehouseRequest, CreateZoneRequest, CreateLocationRequest,
    LocationType,
} from '../types';
import { LOCATION_TYPE_LABELS, LOCATION_TYPE_COLORS } from '../types';

const LOCATION_TYPES: LocationType[] = ['Storage', 'Receiving', 'Shipping', 'Picking', 'Damage'];

// ─── Shared Modal ─────────────────────────────────────────────────────────────

interface SimpleModalProps {
    title: string;
    onClose: () => void;
    onSave: () => Promise<void>;
    disabled?: boolean;
    children: React.ReactNode;
}

function SimpleModal({ title, onClose, onSave, disabled, children }: SimpleModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handle() {
        setError(null);
        setLoading(true);
        try {
            await onSave();
            onClose();
        } catch (err: unknown) {
            setError(
                (err as { response?: { data?: string } })?.response?.data ?? 'Помилка збереження'
            );
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
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>{title}</h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">{children}</div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button onClick={handle} disabled={loading || disabled}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                            style={{
                                background: loading || disabled ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || disabled ? 'not-allowed' : 'pointer',
                            }}>
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>{label}</label>
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    return (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
    );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
                           icon, label, count, color, expanded, onToggle, onAdd, onEdit, onDelete, isAdmin,
                       }: {
    icon: React.ReactNode; label: string; count?: number; color: string;
    expanded?: boolean; onToggle?: () => void;
    onAdd?: () => void; onEdit?: () => void; onDelete?: () => void;
    isAdmin: boolean;
}) {
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer group"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            onClick={onToggle}
        >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                 style={{ background: `${color}18` }}>
                <span style={{ color }}>{icon}</span>
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: '#f1f5f9' }}>{label}</span>
            {count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#475569' }}>
          {count}
        </span>
            )}
            {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={e => e.stopPropagation()}>
                    {onAdd && (
                        <button onClick={onAdd} className="p-1 rounded"
                                style={{ color: '#475569' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                            <Plus size={14} />
                        </button>
                    )}
                    {onEdit && (
                        <button onClick={onEdit} className="p-1 rounded"
                                style={{ color: '#475569' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                            <Pencil size={13} />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} className="p-1 rounded"
                                style={{ color: '#475569' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            )}
            {onToggle && (
                <span style={{ color: '#334155' }}>
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Modal =
    | { type: 'warehouse-create' }
    | { type: 'warehouse-edit'; warehouse: WarehouseEntity }
    | { type: 'warehouse-delete'; warehouse: WarehouseEntity }
    | { type: 'zone-create'; warehouseId: string }
    | { type: 'zone-edit'; zone: ZoneEntity }
    | { type: 'zone-delete'; zone: ZoneEntity }
    | { type: 'location-create'; zoneId: string }
    | { type: 'location-edit'; location: LocationEntity }
    | { type: 'location-delete'; location: LocationEntity };

export default function WarehousePage() {
    const { isAdmin } = useRole();
    const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([]);
    const [zones, setZones] = useState<Record<string, ZoneEntity[]>>({});
    const [locations, setLocations] = useState<Record<string, LocationEntity[]>>({});
    const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(new Set());
    const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Modal | null>(null);

    // Form state
    const [whForm, setWhForm] = useState({ name: '', address: '' });
    const [zoneForm, setZoneForm] = useState({ name: '' });
    const [locForm, setLocForm] = useState({ code: '', type: 'Storage' as LocationType });

    useEffect(() => {
        warehouseService.getAll().then(data => {
            setWarehouses(data);
            setLoading(false);
        });
    }, []);

    // ── Toggle expand ───────────────────────────────────────────────────────────

    async function toggleWarehouse(id: string) {
        const next = new Set(expandedWarehouses);
        if (next.has(id)) { next.delete(id); }
        else {
            next.add(id);
            if (!zones[id]) {
                const data = await warehouseService.getZones(id);
                setZones(p => ({ ...p, [id]: data }));
            }
        }
        setExpandedWarehouses(next);
    }

    async function toggleZone(id: string) {
        const next = new Set(expandedZones);
        if (next.has(id)) { next.delete(id); }
        else {
            next.add(id);
            if (!locations[id]) {
                const data = await warehouseService.getLocations(id);
                setLocations(p => ({ ...p, [id]: data }));
            }
        }
        setExpandedZones(next);
    }

    // ── Open modals ─────────────────────────────────────────────────────────────

    function openCreateWarehouse() {
        setWhForm({ name: '', address: '' });
        setModal({ type: 'warehouse-create' });
    }

    function openEditWarehouse(w: WarehouseEntity) {
        setWhForm({ name: w.name, address: w.address ?? '' });
        setModal({ type: 'warehouse-edit', warehouse: w });
    }

    function openCreateZone(warehouseId: string) {
        setZoneForm({ name: '' });
        setModal({ type: 'zone-create', warehouseId });
    }

    function openEditZone(z: ZoneEntity) {
        setZoneForm({ name: z.name });
        setModal({ type: 'zone-edit', zone: z });
    }

    function openCreateLocation(zoneId: string) {
        setLocForm({ code: '', type: 'Storage' });
        setModal({ type: 'location-create', zoneId });
    }

    function openEditLocation(l: LocationEntity) {
        setLocForm({ code: l.code, type: l.type });
        setModal({ type: 'location-edit', location: l });
    }

    // ── Save handlers ───────────────────────────────────────────────────────────

    async function saveWarehouse() {
        const req: CreateWarehouseRequest = { name: whForm.name, address: whForm.address || undefined };
        if (modal?.type === 'warehouse-create') {
            const created = await warehouseService.create(req);
            setWarehouses(p => [...p, created]);
        } else if (modal?.type === 'warehouse-edit') {
            const updated = await warehouseService.update(modal.warehouse.id, req);
            setWarehouses(p => p.map(w => w.id === updated.id ? { ...updated, zones: w.zones } : w));
        }
    }

    async function deleteWarehouse(w: WarehouseEntity) {
        await warehouseService.deleteWarehouse(w.id);
        setWarehouses(p => p.filter(x => x.id !== w.id));
    }

    async function saveZone() {
        if (modal?.type === 'zone-create') {
            const req: CreateZoneRequest = { warehouseId: modal.warehouseId, name: zoneForm.name };
            const created = await warehouseService.createZone(req);
            setZones(p => ({ ...p, [modal.warehouseId]: [...(p[modal.warehouseId] ?? []), created] }));
        } else if (modal?.type === 'zone-edit') {
            const req: CreateZoneRequest = { warehouseId: modal.zone.warehouseId, name: zoneForm.name };
            const updated = await warehouseService.updateZone(modal.zone.id, req);
            setZones(p => ({
                ...p,
                [modal.zone.warehouseId]: p[modal.zone.warehouseId]?.map(z => z.id === updated.id ? { ...updated, locations: z.locations } : z) ?? [],
            }));
        }
    }

    async function deleteZone(z: ZoneEntity) {
        await warehouseService.deleteZone(z.id);
        setZones(p => ({ ...p, [z.warehouseId]: p[z.warehouseId]?.filter(x => x.id !== z.id) ?? [] }));
    }

    async function saveLocation() {
        if (modal?.type === 'location-create') {
            const req: CreateLocationRequest = { zoneId: modal.zoneId, code: locForm.code, type: locForm.type };
            const created = await warehouseService.createLocation(req);
            setLocations(p => ({ ...p, [modal.zoneId]: [...(p[modal.zoneId] ?? []), created] }));
        } else if (modal?.type === 'location-edit') {
            const req: CreateLocationRequest = { zoneId: modal.location.zoneId, code: locForm.code, type: locForm.type };
            const updated = await warehouseService.updateLocation(modal.location.id, req);
            setLocations(p => ({
                ...p,
                [modal.location.zoneId]: p[modal.location.zoneId]?.map(l => l.id === updated.id ? updated : l) ?? [],
            }));
        }
    }

    async function deleteLocation(l: LocationEntity) {
        await warehouseService.deleteLocation(l.id);
        setLocations(p => ({ ...p, [l.zoneId]: p[l.zoneId]?.filter(x => x.id !== l.id) ?? [] }));
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Modals ── */}
            {(modal?.type === 'warehouse-create' || modal?.type === 'warehouse-edit') && (
                <SimpleModal
                    title={modal.type === 'warehouse-create' ? 'Новий склад' : 'Редагувати склад'}
                    onClose={() => setModal(null)}
                    onSave={saveWarehouse}
                    disabled={!whForm.name}
                >
                    <Field label="Назва складу *">
                        <Input value={whForm.name} onChange={v => setWhForm(p => ({ ...p, name: v }))} placeholder="Центральний склад" />
                    </Field>
                    <Field label="Адреса">
                        <Input value={whForm.address} onChange={v => setWhForm(p => ({ ...p, address: v }))} placeholder="вул. Складська, 1" />
                    </Field>
                </SimpleModal>
            )}

            {modal?.type === 'warehouse-delete' && (
                <SimpleModal
                    title="Видалити склад?"
                    onClose={() => setModal(null)}
                    onSave={() => deleteWarehouse(modal.warehouse)}
                >
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                        Склад <strong>{modal.warehouse.name}</strong> буде видалено. Це незворотня дія.
                    </p>
                </SimpleModal>
            )}

            {(modal?.type === 'zone-create' || modal?.type === 'zone-edit') && (
                <SimpleModal
                    title={modal.type === 'zone-create' ? 'Нова зона' : 'Редагувати зону'}
                    onClose={() => setModal(null)}
                    onSave={saveZone}
                    disabled={!zoneForm.name}
                >
                    <Field label="Назва зони *">
                        <Input value={zoneForm.name} onChange={v => setZoneForm({ name: v })} placeholder="Зона А" />
                    </Field>
                </SimpleModal>
            )}

            {modal?.type === 'zone-delete' && (
                <SimpleModal title="Видалити зону?" onClose={() => setModal(null)} onSave={() => deleteZone(modal.zone)}>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                        Зона <strong>{modal.zone.name}</strong> буде видалена разом з усіма комірками.
                    </p>
                </SimpleModal>
            )}

            {(modal?.type === 'location-create' || modal?.type === 'location-edit') && (
                <SimpleModal
                    title={modal.type === 'location-create' ? 'Нова комірка' : 'Редагувати комірку'}
                    onClose={() => setModal(null)}
                    onSave={saveLocation}
                    disabled={!locForm.code}
                >
                    <Field label="Код комірки *">
                        <Input value={locForm.code} onChange={v => setLocForm(p => ({ ...p, code: v }))} placeholder="A-01-001" />
                    </Field>
                    <Field label="Тип комірки">
                        <select
                            value={locForm.type}
                            onChange={e => setLocForm(p => ({ ...p, type: e.target.value as LocationType }))}
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                            style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                        >
                            {LOCATION_TYPES.map(t => (
                                <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>
                            ))}
                        </select>
                    </Field>
                </SimpleModal>
            )}

            {modal?.type === 'location-delete' && (
                <SimpleModal title="Видалити комірку?" onClose={() => setModal(null)} onSave={() => deleteLocation(modal.location)}>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                        Комірка <strong>{modal.location.code}</strong> буде видалена.
                    </p>
                </SimpleModal>
            )}

            {/* ── Page header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Топологія складу</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>
                        Ієрархія: Склад → Зони → Комірки
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={openCreateWarehouse}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                        style={{ background: '#6366f1', color: '#fff' }}
                    >
                        <Plus size={16} /> Новий склад
                    </button>
                )}
            </div>

            {/* ── Tree ── */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : warehouses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Warehouse size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>Складів ще немає</p>
                    {isAdmin && (
                        <button onClick={openCreateWarehouse}
                                className="text-sm px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                            Створити перший склад
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {warehouses.map(warehouse => (
                        <div key={warehouse.id} className="rounded-xl overflow-hidden"
                             style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

                            {/* Warehouse row */}
                            <SectionHeader
                                icon={<Warehouse size={15} />}
                                label={warehouse.name}
                                color="#6366f1"
                                expanded={expandedWarehouses.has(warehouse.id)}
                                onToggle={() => toggleWarehouse(warehouse.id)}
                                onAdd={() => openCreateZone(warehouse.id)}
                                onEdit={() => openEditWarehouse(warehouse)}
                                onDelete={() => setModal({ type: 'warehouse-delete', warehouse })}
                                isAdmin={isAdmin}
                            />

                            {/* Zones */}
                            {expandedWarehouses.has(warehouse.id) && (
                                <div className="pl-6 pr-3 pb-3 pt-2 space-y-2"
                                     style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    {(zones[warehouse.id] ?? []).length === 0 ? (
                                        <p className="text-xs py-2 px-3" style={{ color: '#334155' }}>
                                            Зон немає — {isAdmin ? 'натисни + щоб додати' : 'зверніться до адміна'}
                                        </p>
                                    ) : (
                                        (zones[warehouse.id] ?? []).map(zone => (
                                            <div key={zone.id}>
                                                <SectionHeader
                                                    icon={<Layers size={14} />}
                                                    label={zone.name}
                                                    count={(locations[zone.id] ?? []).length || undefined}
                                                    color="#2dd4bf"
                                                    expanded={expandedZones.has(zone.id)}
                                                    onToggle={() => toggleZone(zone.id)}
                                                    onAdd={() => openCreateLocation(zone.id)}
                                                    onEdit={() => openEditZone(zone)}
                                                    onDelete={() => setModal({ type: 'zone-delete', zone })}
                                                    isAdmin={isAdmin}
                                                />

                                                {/* Locations */}
                                                {expandedZones.has(zone.id) && (
                                                    <div className="pl-6 pt-2 pb-1 space-y-1">
                                                        {(locations[zone.id] ?? []).length === 0 ? (
                                                            <p className="text-xs py-1 px-3" style={{ color: '#334155' }}>
                                                                Комірок немає
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                {(locations[zone.id] ?? []).map(loc => (
                                                                    <div key={loc.id}
                                                                         className="flex items-center justify-between rounded-lg px-3 py-2 group"
                                                                         style={{
                                                                             background: 'rgba(255,255,255,0.03)',
                                                                             border: `1px solid ${LOCATION_TYPE_COLORS[loc.type]}25`,
                                                                         }}>
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <MapPin size={12} className="shrink-0" style={{ color: LOCATION_TYPE_COLORS[loc.type] }} />
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-mono font-medium truncate" style={{ color: '#f1f5f9' }}>
                                                                                    {loc.code}
                                                                                </p>
                                                                                <p className="text-xs" style={{ color: LOCATION_TYPE_COLORS[loc.type] }}>
                                                                                    {LOCATION_TYPE_LABELS[loc.type]}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {isAdmin && (
                                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                                <button onClick={() => openEditLocation(loc)}
                                                                                        style={{ color: '#475569' }}
                                                                                        onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                                                                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                                                                    <Pencil size={11} />
                                                                                </button>
                                                                                <button onClick={() => setModal({ type: 'location-delete', location: loc })}
                                                                                        style={{ color: '#475569' }}
                                                                                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                                                                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                                                                                    <Trash2 size={11} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}