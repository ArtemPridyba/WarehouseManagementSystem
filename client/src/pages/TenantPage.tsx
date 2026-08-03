import { useState, useEffect } from 'react';
import {
    Building2, Users, Package, ArrowDownToLine, ArrowUpFromLine,
    BarChart3, Edit3, X, Calendar, Mail, Phone, MapPin,
    CreditCard, Zap, ShieldCheck, Sparkles, AlertTriangle,
} from 'lucide-react';
import { tenantService } from '../services/tenant.service';
import type { TenantDto, UpdateTenantRequest } from '../types';
import { useRole } from '../hooks/useAuth';

const PLAN_CONFIG: Record<string, {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    description: string;
}> = {
    Free: {
        icon: <Zap size={12} />,
        color: '#94a3b8',
        bg: 'rgba(148,163,184,0.1)',
        border: 'rgba(148,163,184,0.2)',
        description: 'Базовий план для невеликих команд',
    },
    Pro: {
        icon: <Sparkles size={12} />,
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.1)',
        border: 'rgba(96,165,250,0.25)',
        description: 'Розширені можливості для бізнесу',
    },
    Enterprise: {
        icon: <ShieldCheck size={12} />,
        color: '#a78bfa',
        bg: 'rgba(167,139,250,0.1)',
        border: 'rgba(167,139,250,0.25)',
        description: 'Необмежені можливості для великих організацій',
    },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function getPlanInfo(planExpiresAt: string | null) {
    if (!planExpiresAt) {
        return { planExpiresDate: null, planExpired: false, daysLeft: null, planSoonExpires: false };
    }
    const expiresAt = new Date(planExpiresAt);
    const now       = new Date();
    const days      = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
    return {
        planExpiresDate:  formatDate(planExpiresAt),
        planExpired:      expiresAt < now,
        daysLeft:         days,
        planSoonExpires:  days > 0 && days <= 14,
    };
}

function PlanBadge({ plan }: { plan: string }) {
    const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.Free;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
            {cfg.icon} {plan}
        </span>
    );
}

function StatCard({ icon, label, value, iconColor, iconBg }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <div className="p-2 rounded-lg shrink-0" style={{ background: iconBg }}>
                <span style={{ color: iconColor }}>{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs truncate" style={{ color: '#475569' }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: '#f1f5f9' }}>{value}</p>
            </div>
        </div>
    );
}

function ContactRow({ icon, value, placeholder }: {
    icon: React.ReactNode;
    value: string | null;
    placeholder: string;
}) {
    return (
        <div className="flex items-center gap-2.5 text-sm">
            <span style={{ color: '#334155' }}>{icon}</span>
            {value
                ? <span style={{ color: '#94a3b8' }}>{value}</span>
                : <span className="italic text-xs" style={{ color: '#334155' }}>{placeholder}</span>
            }
        </div>
    );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
           style={{ color: '#334155' }}>
            {icon} {label}
        </p>
    );
}

function EditInfoModal({ tenant, onSave, onClose }: {
    tenant: TenantDto;
    onSave: (data: UpdateTenantRequest) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState<UpdateTenantRequest>({
        name:    tenant.name,
        email:   tenant.email,
        phone:   tenant.phone,
        address: tenant.address,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    const setField = (key: keyof UpdateTenantRequest) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(f => ({ ...f, [key]: e.target.value || null }));

    const handleSubmit = async () => {
        if (!form.name.trim()) { setError("Назва обов'язкова"); return; }
        setSaving(true);
        try { await onSave({ ...form, name: form.name.trim() }); onClose(); }
        catch { setError('Помилка збереження'); }
        finally { setSaving(false); }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f1f5f9',
    };
    const inputClass = 'w-full px-3 py-2 rounded-lg text-sm outline-none transition focus:ring-1 focus:ring-indigo-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                        Редагування організації
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#475569' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                        <X size={15} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-3">
                    {error && (
                        <p className="text-xs px-3 py-2 rounded-lg"
                           style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                            {error}
                        </p>
                    )}
                    {([
                        { key: 'name'  as const, label: "Назва компанії *", icon: <Building2 size={13}/>, type: 'text',  ph: "ТОВ «Склад»" },
                        { key: 'email' as const, label: 'Email',             icon: <Mail size={13}/>,      type: 'email', ph: 'info@company.com' },
                        { key: 'phone' as const, label: 'Телефон',           icon: <Phone size={13}/>,     type: 'tel',   ph: '+380...' },
                    ]).map(({ key, label, icon, type, ph }) => (
                        <div key={key}>
                            <label className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: '#475569' }}>
                                {icon} {label}
                            </label>
                            <input type={type} value={form[key] ?? ''} onChange={setField(key)}
                                   placeholder={ph} className={inputClass} style={inputStyle} />
                        </div>
                    ))}
                    <div>
                        <label className="text-xs mb-1.5 flex items-center gap-1.5" style={{ color: '#475569' }}>
                            <MapPin size={13}/> Адреса
                        </label>
                        <textarea value={form.address ?? ''} onChange={setField('address')}
                                  placeholder="вул. Складська, 1, Київ" rows={2}
                                  className={`${inputClass} resize-none`} style={inputStyle} />
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm transition"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                        Скасувати
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                            className="flex-1 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'rgba(99,102,241,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}>
                        {saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UpgradeModal({ currentPlan, onClose }: { currentPlan: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                        Змінити тарифний план
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#475569' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                        <X size={15} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-2">
                    {(['Free', 'Pro', 'Enterprise'] as const).map(plan => {
                        const cfg       = PLAN_CONFIG[plan];
                        const isCurrent = plan === currentPlan;
                        return (
                            <div key={plan}
                                 className="flex items-center justify-between p-4 rounded-xl"
                                 style={{
                                     background: isCurrent ? cfg.bg : 'rgba(255,255,255,0.02)',
                                     border: `1px solid ${isCurrent ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                                 }}>
                                <div className="flex items-center gap-3">
                                    <PlanBadge plan={plan} />
                                    <span className="text-xs" style={{ color: '#475569' }}>{cfg.description}</span>
                                </div>
                                {isCurrent
                                    ? <span className="text-xs font-medium" style={{ color: cfg.color }}>Поточний</span>
                                    : <button onClick={onClose}
                                              className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                                              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
                                        Обрати
                                    </button>
                                }
                            </div>
                        );
                    })}
                </div>

                <div className="px-6 py-4 text-center"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs" style={{ color: '#334155' }}>
                        Для зміни плану зверніться до служби підтримки
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function TenantPage() {
    const { isAdmin } = useRole();
    const [tenant, setTenant]             = useState<TenantDto | null>(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [showEditInfo, setShowEditInfo] = useState(false);
    const [showUpgrade, setShowUpgrade]   = useState(false);

    useEffect(() => {
        tenantService.get()
            .then(setTenant)
            .catch(() => setError('Не вдалося завантажити дані'))
            .finally(() => setLoading(false));
    }, []);

    const handleUpdateInfo = async (data: UpdateTenantRequest) => {
        const updated = await tenantService.update(data);
        setTenant(updated);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#334155' }}>
            Завантаження...
        </div>
    );
    if (error || !tenant) return (
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#f87171' }}>
            {error || 'Помилка завантаження'}
        </div>
    );

    const createdDate = formatDate(tenant.createdAt);
    const { planExpiresDate, planExpired, daysLeft, planSoonExpires } = getPlanInfo(tenant.planExpiresAt);

    const STATS = [
        { icon: <Building2 size={16}/>,      label: 'Склади',                value: tenant.warehouseCount,      iconColor: '#60a5fa', iconBg: 'rgba(96,165,250,0.1)' },
        { icon: <Users size={16}/>,           label: 'Користувачі',            value: tenant.userCount,            iconColor: '#a78bfa', iconBg: 'rgba(167,139,250,0.1)' },
        { icon: <Package size={16}/>,         label: 'Товари (SKU)',           value: tenant.productCount,         iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.1)' },
        { icon: <BarChart3 size={16}/>,       label: 'Транзакції',             value: tenant.transactionCount,     iconColor: '#fb923c', iconBg: 'rgba(251,146,60,0.1)' },
        { icon: <ArrowDownToLine size={16}/>, label: 'Активні прийоми',       value: tenant.activeInboundOrders,  iconColor: '#22d3ee', iconBg: 'rgba(34,211,238,0.1)' },
        { icon: <ArrowUpFromLine size={16}/>, label: 'Активні відвантаження', value: tenant.activeOutboundOrders, iconColor: '#f472b6', iconBg: 'rgba(244,114,182,0.1)' },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {showEditInfo && (
                <EditInfoModal tenant={tenant} onSave={handleUpdateInfo} onClose={() => setShowEditInfo(false)} />
            )}
            {showUpgrade && (
                <UpgradeModal currentPlan={tenant.planName} onClose={() => setShowUpgrade(false)} />
            )}

            <div>
                <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
                    {isAdmin ? 'Організація' : 'Компанія'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
                    {isAdmin ? 'Налаштування та інформація про тенанта' : 'Інформація про вашу організацію'}
                </p>
            </div>

            <div className="rounded-xl overflow-hidden"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-6 py-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl shrink-0"
                         style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Building2 size={26} style={{ color: '#818cf8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>{tenant.name}</h2>
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: '#334155' }}>
                                    <Calendar size={11} />
                                    <span>Зареєстровано {createdDate}</span>
                                </div>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEditInfo(true)}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                                        e.currentTarget.style.color = '#a5b4fc';
                                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.color = '#475569';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    }}>
                                    <Edit3 size={12} /> Редагувати
                                </button>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            <ContactRow icon={<Mail size={13}/>}   value={tenant.email}   placeholder="Email не вказано" />
                            <ContactRow icon={<Phone size={13}/>}  value={tenant.phone}   placeholder="Телефон не вказано" />
                            <ContactRow icon={<MapPin size={13}/>} value={tenant.address} placeholder="Адреса не вказана" />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <SectionLabel icon={<BarChart3 size={12}/>} label="Статистика" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {STATS.map(s => <StatCard key={s.label} {...s} />)}
                </div>
            </div>

            {isAdmin && (
                <div>
                    <SectionLabel icon={<CreditCard size={12}/>} label="Тарифний план" />

                    {planExpired && (
                        <div className="flex items-center gap-2.5 px-4 py-3 mb-3 rounded-xl text-sm"
                             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Термін дії плану закінчився {planExpiresDate}. Зверніться до підтримки.</span>
                        </div>
                    )}
                    {planSoonExpires && (
                        <div className="flex items-center gap-2.5 px-4 py-3 mb-3 rounded-xl text-sm"
                             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>План закінчується через {daysLeft} дн. ({planExpiresDate})</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-5 py-4 rounded-xl"
                         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="space-y-1.5">
                            <PlanBadge plan={tenant.planName} />
                            <p className="text-xs" style={{ color: '#334155' }}>
                                {planExpiresDate && !planExpired
                                    ? `Діє до ${planExpiresDate}`
                                    : planExpired
                                        ? 'Термін дії закінчився'
                                        : 'Безстроковий'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUpgrade(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}>
                            <Sparkles size={13} /> Змінити план
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}