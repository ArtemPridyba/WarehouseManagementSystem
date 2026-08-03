import { useEffect, useState } from 'react';
import {
    Plus, Loader2, X, Shield, HardHat,
    Mail, Calendar, Search, Pencil, Trash2, KeyRound,
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import type { EmployeeDto, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    Manager: { label: 'Менеджер', icon: <Shield size={15} /> },
    Worker:  { label: 'Комірник', icon: <HardHat size={15} /> },
};

const BADGE_CONFIG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
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

// ─── Shared components ────────────────────────────────────────────────────────

function Field({ placeholder, value, onChange, type = 'text' }: {
    placeholder: string; value: string;
    onChange: (v: string) => void; type?: string;
}) {
    return (
        <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)', color: '#f1f5f9' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
        />
    );
}

function RoleSelector({ value, onChange }: {
    value: 'Manager' | 'Worker';
    onChange: (v: 'Manager' | 'Worker') => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {(['Manager', 'Worker'] as const).map(role => (
                <button key={role} type="button" onClick={() => onChange(role)}
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-all"
                        style={{
                            border: `1px solid ${value === role ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                            background: value === role ? 'rgba(99,102,241,0.1)' : '#13151f',
                            color: value === role ? '#818cf8' : '#475569',
                        }}>
                    {ROLE_CONFIG[role].icon} {ROLE_CONFIG[role].label}
                </button>
            ))}
        </div>
    );
}

function ModalError({ message }: { message: string }) {
    return (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm"
             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {message}
        </div>
    );
}

function ModalWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
                 style={{ background: '#0B0D14', border: '1px solid rgba(255,255,255,0.06)' }}>
                {children}
            </div>
        </div>
    );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (emp: EmployeeDto) => void }) {
    const [form, setForm] = useState<CreateEmployeeRequest>({
        firstName: '', lastName: '', email: '', password: '', role: 'Worker',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function handleSubmit() {
        setError(null); setLoading(true);
        try {
            const created = await authService.addEmployee(form);
            onAdd(created); onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка додавання');
        } finally { setLoading(false); }
    }

    const isValid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password.length >= 6;

    return (
        <ModalWrapper>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>Додати співробітника</h2>
                <button onClick={onClose} style={{ color: '#475569' }}><X size={20} /></button>
            </div>
            {error && <ModalError message={error} />}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Field placeholder="Ім'я" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} />
                    <Field placeholder="Прізвище" value={form.lastName} onChange={v => setForm(p => ({ ...p, lastName: v }))} />
                </div>
                <Field placeholder="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                <Field placeholder="Пароль (мін. 6 символів)" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} />
                <RoleSelector value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="flex-1 rounded-xl py-3 text-sm font-medium"
                        style={{ background: '#13151f', color: '#94a3b8' }}>Скасувати</button>
                <button onClick={handleSubmit} disabled={loading || !isValid}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                        style={{ background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', cursor: loading || !isValid ? 'not-allowed' : 'pointer' }}>
                    {loading && <Loader2 size={16} className="animate-spin" />} Додати
                </button>
            </div>
        </ModalWrapper>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditEmployeeModal({ employee, onClose, onSave }: {
    employee: EmployeeDto; onClose: () => void; onSave: (updated: EmployeeDto) => void;
}) {
    const [form, setForm] = useState<UpdateEmployeeRequest>({
        firstName: employee.firstName,
        lastName:  employee.lastName,
        role:      employee.role as 'Manager' | 'Worker',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function handleSubmit() {
        setError(null); setLoading(true);
        try {
            const updated = await authService.updateEmployee(employee.id, form);
            onSave(updated); onClose();
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка збереження');
        } finally { setLoading(false); }
    }

    const isValid = form.firstName.trim() && form.lastName.trim();

    return (
        <ModalWrapper>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>Редагувати співробітника</h2>
                <button onClick={onClose} style={{ color: '#475569' }}><X size={20} /></button>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                <Mail size={14} /> <span>{employee.email}</span>
            </div>
            {error && <ModalError message={error} />}
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Field placeholder="Ім'я" value={form.firstName} onChange={v => setForm(p => ({ ...p, firstName: v }))} />
                    <Field placeholder="Прізвище" value={form.lastName} onChange={v => setForm(p => ({ ...p, lastName: v }))} />
                </div>
                <RoleSelector value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="flex-1 rounded-xl py-3 text-sm font-medium"
                        style={{ background: '#13151f', color: '#94a3b8' }}>Скасувати</button>
                <button onClick={handleSubmit} disabled={loading || !isValid}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                        style={{ background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', cursor: loading || !isValid ? 'not-allowed' : 'pointer' }}>
                    {loading && <Loader2 size={16} className="animate-spin" />} Зберегти
                </button>
            </div>
        </ModalWrapper>
    );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({ employee, onClose }: { employee: EmployeeDto; onClose: () => void }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [success, setSuccess]   = useState(false);

    const passwordsMatch = password === confirm;
    const isValid = password.length >= 6 && passwordsMatch;

    async function handleSubmit() {
        setError(null); setLoading(true);
        try {
            await authService.resetEmployeePassword(employee.id, password);
            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch (err: unknown) {
            setError((err as { response?: { data?: string } })?.response?.data ?? 'Помилка зміни паролю');
        } finally { setLoading(false); }
    }

    return (
        <ModalWrapper>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>Скинути пароль</h2>
                <button onClick={onClose} style={{ color: '#475569' }}><X size={20} /></button>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
                <Mail size={14} />
                <span>{employee.firstName} {employee.lastName}</span>
                <span className="ml-1 text-xs" style={{ color: '#334155' }}>({employee.email})</span>
            </div>
            {error && <ModalError message={error} />}
            {success ? (
                <div className="rounded-xl px-4 py-4 text-sm text-center"
                     style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
                    Пароль успішно змінено ✓
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        <Field placeholder="Новий пароль (мін. 6 символів)" type="password" value={password} onChange={setPassword} />
                        <Field placeholder="Повторіть пароль" type="password" value={confirm} onChange={setConfirm} />
                        {confirm.length > 0 && !passwordsMatch && (
                            <p className="text-xs" style={{ color: '#f87171' }}>Паролі не співпадають</p>
                        )}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={onClose} className="flex-1 rounded-xl py-3 text-sm font-medium"
                                style={{ background: '#13151f', color: '#94a3b8' }}>Скасувати</button>
                        <button onClick={handleSubmit} disabled={loading || !isValid}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                                style={{ background: loading || !isValid ? 'rgba(245,158,11,0.4)' : '#d97706', color: '#fff', cursor: loading || !isValid ? 'not-allowed' : 'pointer' }}>
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            <KeyRound size={14} /> Змінити пароль
                        </button>
                    </div>
                </>
            )}
        </ModalWrapper>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
    const { confirm, options, handleConfirm, handleClose } = useConfirm();

    const [employees, setEmployees]         = useState<EmployeeDto[]>([]);
    const [loading, setLoading]             = useState(true);
    const [search, setSearch]               = useState('');
    const [addModal, setAddModal]           = useState(false);
    const [editEmployee, setEditEmployee]   = useState<EmployeeDto | null>(null);
    const [resetEmployee, setResetEmployee] = useState<EmployeeDto | null>(null);

    useEffect(() => {
        let mounted = true;
        authService.getEmployees()
            .then(d => { if (mounted) setEmployees(d); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    async function handleDelete(emp: EmployeeDto) {
        const confirmed = await confirm({
            title:        'Видалити співробітника?',
            message:      `${emp.firstName} ${emp.lastName} (${emp.email}) буде видалено назавжди.`,
            confirmLabel: 'Видалити',
            danger:       true,
        });
        if (!confirmed) return;
        try {
            await authService.deleteEmployee(emp.id);
            setEmployees(prev => prev.filter(e => e.id !== emp.id));
        } catch (err: unknown) {
            console.error((err as { response?: { data?: string } })?.response?.data ?? 'Помилка видалення');
        }
    }

    const filtered = employees.filter(e =>
        e.firstName.toLowerCase().includes(search.toLowerCase()) ||
        e.lastName.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (b.role === 'Admin' && a.role !== 'Admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="space-y-6">
            {options && <ConfirmModal {...options} onConfirm={handleConfirm} onClose={handleClose} />}
            {addModal && (
                <AddEmployeeModal onClose={() => setAddModal(false)} onAdd={emp => setEmployees(prev => [...prev, emp])} />
            )}
            {editEmployee && (
                <EditEmployeeModal
                    employee={editEmployee}
                    onClose={() => setEditEmployee(null)}
                    onSave={updated => { setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e)); setEditEmployee(null); }}
                />
            )}
            {resetEmployee && (
                <ResetPasswordModal employee={resetEmployee} onClose={() => setResetEmployee(null)} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Користувачі</h1>
                    <p className="text-sm mt-1" style={{ color: '#475569' }}>{employees.length} співробітників у компанії</p>
                </div>
                <button onClick={() => setAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: '#6366f1', color: '#fff' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#585ad4')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}>
                    <Plus size={16} /> Додати співробітника
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5" size={18} style={{ color: '#334155' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="Пошук за ім'ям або email..."
                       className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                       style={{ background: '#0B0D14', border: '1px solid rgba(255,255,255,0.06)', color: '#f1f5f9' }}
                       onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                       onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')} />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center h-48 items-center">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <p className="text-sm" style={{ color: '#334155' }}>
                        {search ? 'Нікого не знайдено' : 'Співробітників ще немає'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map(emp => {
                        const badge   = BADGE_CONFIG[emp.role] ?? BADGE_CONFIG.Worker;
                        const isAdmin = emp.role === 'Admin';
                        return (
                            <div key={emp.id}
                                 className="rounded-2xl p-5 group transition-all flex flex-col"
                                 style={{
                                     background: '#0B0D14',
                                     border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                 }}
                                 onMouseEnter={e => (e.currentTarget.style.borderColor = isAdmin ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)')}
                                 onMouseLeave={e => (e.currentTarget.style.borderColor = isAdmin ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)')}>

                                {/* ── Top: аватар + бейдж ─────────────────── */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                         style={{ background: '#13151f', color: '#6366f1' }}>
                                        {emp.firstName[0]}{emp.lastName[0]}
                                    </div>

                                    {/* Бейдж ролі — завжди видимий, справа */}
                                    <span className="text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium uppercase tracking-wide"
                                          style={{ background: badge.bg, color: badge.color }}>
                                        {badge.icon} {badge.label}
                                    </span>
                                </div>

                                {/* ── Ім'я + email ────────────────────────── */}
                                <h3 className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>
                                    {emp.firstName} {emp.lastName}
                                </h3>
                                <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: '#475569' }}>
                                    <Mail size={11} /> {emp.email}
                                </p>

                                {/* ── Footer: дата + кнопки дій ───────────── */}
                                <div className="mt-auto pt-4 mt-4 flex items-center justify-between"
                                     style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

                                    {/* Дата */}
                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#334155' }}>
                                        <Calendar size={13} />
                                        {new Date(emp.createdAt).toLocaleDateString('uk-UA')}
                                    </div>

                                    {/* Кнопки дій — тільки для не-адмінів */}
                                    {!isAdmin && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditEmployee(emp)}
                                                className="p-1.5 rounded-lg transition-colors"
                                                style={{ color: '#334155' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                                                title="Редагувати">
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setResetEmployee(emp)}
                                                className="p-1.5 rounded-lg transition-colors"
                                                style={{ color: '#334155' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                                                title="Скинути пароль">
                                                <KeyRound size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp)}
                                                className="p-1.5 rounded-lg transition-colors"
                                                style={{ color: '#334155' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
                                                title="Видалити">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}