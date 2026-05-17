import { useEffect, useState } from 'react';
import {
    Users, Plus, Loader2, X,
    Shield, HardHat, Mail, Calendar,
} from 'lucide-react';
import { authService } from '../services/auth.service';
import type { EmployeeDto, CreateEmployeeRequest } from '../types';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
    bg: string; color: string; border: string;
    label: string; icon: React.ReactNode;
}> = {
    Manager: {
        bg: 'rgba(245,158,11,0.1)', color: '#f59e0b',
        border: 'rgba(245,158,11,0.5)', label: 'Менеджер',
        icon: <Shield size={15} />,
    },
    Worker: {
        bg: 'rgba(45,212,191,0.1)', color: '#2dd4bf',
        border: 'rgba(45,212,191,0.5)', label: 'Комірник',
        icon: <HardHat size={15} />,
    },
};

const BADGE_CONFIG: Record<string, {
    bg: string; color: string; label: string; icon: React.ReactNode;
}> = {
    Admin: {
        bg: 'rgba(99,102,241,0.12)', color: '#818cf8',
        label: 'Адмін', icon: <Shield size={11} />,
    },
    Manager: {
        bg: 'rgba(245,158,11,0.12)', color: '#f59e0b',
        label: 'Менеджер', icon: <Shield size={11} />,
    },
    Worker: {
        bg: 'rgba(45,212,191,0.12)', color: '#2dd4bf',
        label: 'Комірник', icon: <HardHat size={11} />,
    },
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onAdd }: {
    onClose: () => void;
    onAdd: (emp: EmployeeDto) => void;
}) {
    const [form, setForm] = useState<CreateEmployeeRequest>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'Worker',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set(field: keyof CreateEmployeeRequest, value: string) {
        setForm(p => ({ ...p, [field]: value }));
    }

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await authService.addEmployee(form);
            const employees = await authService.getEmployees();
            const newest = employees.find(e => e.email === form.email);
            if (newest) onAdd(newest);
            onClose();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: string } })?.response?.data ??
                'Помилка додавання співробітника';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    const isValid = form.firstName && form.lastName && form.email && form.password.length >= 6;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        Додати співробітника
                    </h2>
                    <button onClick={onClose} style={{ color: '#475569' }}><X size={18} /></button>
                </div>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Ім'я + Прізвище */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Ім'я *
                            </label>
                            <input
                                value={form.firstName}
                                onChange={e => set('firstName', e.target.value)}
                                placeholder="Іван"
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Прізвище *
                            </label>
                            <input
                                value={form.lastName}
                                onChange={e => set('lastName', e.target.value)}
                                placeholder="Петренко"
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            placeholder="ivan@company.com"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Пароль * <span style={{ color: '#334155' }}>(мін. 6 символів)</span>
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => set('password', e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>

                    {/* Роль — тільки Manager і Worker, Admin створюється при реєстрації */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Роль
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Manager', 'Worker'] as const).map(role => {
                                const rc = ROLE_CONFIG[role];
                                const isSelected = form.role === role;
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => set('role', role)}
                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                                        style={{
                                            border: isSelected
                                                ? `1px solid ${rc.border}`
                                                : '1px solid rgba(255,255,255,0.08)',
                                            background: isSelected ? rc.bg : 'rgba(255,255,255,0.02)',
                                            color: isSelected ? rc.color : '#475569',
                                        }}
                                    >
                                        {rc.icon}
                                        {rc.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs mt-2" style={{ color: '#334155' }}>
                            Роль Admin призначається автоматично при реєстрації компанії
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        Скасувати
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isValid}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                        style={{
                            background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                            color: '#fff',
                            cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Додати
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        authService.getEmployees()
            .then(data => { if (mounted) setEmployees(data); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    return (
        <div className="space-y-6">
            {modalOpen && (
                <AddEmployeeModal
                    onClose={() => setModalOpen(false)}
                    onAdd={emp => setEmployees(p => [...p, emp])}
                />
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Користувачі</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>
                        {employees.length} співробітників у компанії
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                    style={{ background: '#6366f1', color: '#fff' }}
                >
                    <Plus size={16} /> Додати співробітника
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map(emp => {
                        const badge = BADGE_CONFIG[emp.role] ?? BADGE_CONFIG.Worker;
                        return (
                            <div key={emp.id} className="rounded-xl p-5"
                                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                         style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                        {emp.firstName[0]}{emp.lastName[0]}
                                    </div>
                                    <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                                          style={{ background: badge.bg, color: badge.color }}>
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                </div>

                                <p className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>
                                    {emp.firstName} {emp.lastName}
                                </p>

                                <div className="flex items-center gap-1.5 mb-3">
                                    <Mail size={12} style={{ color: '#475569' }} />
                                    <p className="text-xs truncate" style={{ color: '#475569' }}>{emp.email}</p>
                                </div>

                                <div className="flex items-center gap-1.5 pt-3"
                                     style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Calendar size={11} style={{ color: '#334155' }} />
                                    <p className="text-xs" style={{ color: '#334155' }}>
                                        {new Date(emp.createdAt).toLocaleDateString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && employees.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Users size={36} style={{ color: '#1e293b' }} />
                    <p className="text-sm" style={{ color: '#334155' }}>Співробітників ще немає</p>
                </div>
            )}
        </div>
    );
}