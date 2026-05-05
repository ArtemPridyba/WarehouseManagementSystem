import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Package, Loader2, AlertCircle, Building2, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import type { RegisterRequest } from '../../types';

export default function RegisterPage() {
    const { execute: loginUser } = useLogin();

    const [form, setForm] = useState<RegisterRequest>({
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set(field: keyof RegisterRequest, value: string) {
        setForm(p => ({ ...p, [field]: value }));
    }

    const passwordMatch = form.password === confirmPassword;
    const isValid =
        form.companyName &&
        form.firstName &&
        form.lastName &&
        form.email &&
        form.password.length >= 6 &&
        passwordMatch;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!isValid) return;
        setError(null);
        setLoading(true);
        try {
            await authService.register(form);
            // Після реєстрації одразу логінимось
            await loginUser({ email: form.email, password: form.password });
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(
                typeof data === 'string'
                    ? data
                    : (data as { title?: string })?.title ?? 'Помилка реєстрації'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex" style={{ background: '#0f1117' }}>

            {/* ── Ліва панель ─────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }} />
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
                }} />

                {/* Лого */}
                <div className="relative flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                         style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <Package size={18} style={{ color: '#818cf8' }} />
                    </div>
                    <span className="text-white font-semibold tracking-tight text-lg">WMS Pro</span>
                </div>

                {/* Кроки */}
                <div className="relative">
                    <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#6366f1' }}>
                        Як це працює
                    </p>
                    <div className="space-y-6">
                        {[
                            { step: '01', title: 'Реєструєш компанію', desc: 'Створюєш акаунт адміністратора для своєї організації' },
                            { step: '02', title: 'Налаштовуєш склад', desc: 'Додаєш склади, зони та комірки під свою топологію' },
                            { step: '03', title: 'Додаєш команду', desc: 'Запрошуєш комірників — вони одразу мають доступ' },
                            { step: '04', title: 'Починаєш роботу', desc: 'Прийом товарів, відвантаження, аналітика в реальному часі' },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                                     style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    {step}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-0.5" style={{ color: '#f1f5f9' }}>{title}</p>
                                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom note */}
                <div className="relative">
                    <p className="text-xs" style={{ color: '#334155' }}>
                        Повна ізоляція даних між компаніями · JWT авторизація · Рольова модель
                    </p>
                </div>
            </div>

            {/* ── Права панель — форма ─────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-sm py-8">

                    {/* Мобільне лого */}
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                            <Package size={16} style={{ color: '#818cf8' }} />
                        </div>
                        <span className="text-white font-semibold">WMS Pro</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
                        Реєстрація компанії
                    </h2>
                    <p className="text-sm mb-8" style={{ color: '#475569' }}>
                        Створіть акаунт адміністратора для вашої організації
                    </p>

                    {/* Помилка */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-lg p-3 mb-6"
                             style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f87171' }} />
                            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Компанія */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Назва компанії *
                            </label>
                            <div className="relative">
                                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                                           style={{ color: '#334155' }} />
                                <input
                                    value={form.companyName}
                                    onChange={e => set('companyName', e.target.value)}
                                    placeholder="ТОВ Моя Компанія"
                                    className="w-full rounded-lg pl-9 pr-3.5 py-2.5 text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Ім'я + Прізвище */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                    Ім'я *
                                </label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                                          style={{ color: '#334155' }} />
                                    <input
                                        value={form.firstName}
                                        onChange={e => set('firstName', e.target.value)}
                                        placeholder="Іван"
                                        className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                    Прізвище *
                                </label>
                                <input
                                    value={form.lastName}
                                    onChange={e => set('lastName', e.target.value)}
                                    placeholder="Петренко"
                                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
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
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                                      style={{ color: '#334155' }} />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    placeholder="admin@company.com"
                                    className="w-full rounded-lg pl-9 pr-3.5 py-2.5 text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Пароль */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Пароль * <span style={{ color: '#334155' }}>(мін. 6 символів)</span>
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                                      style={{ color: '#334155' }} />
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg pl-9 pr-3.5 py-2.5 text-sm outline-none"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Підтвердження паролю */}
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Підтвердження паролю *
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                                      style={{ color: '#334155' }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${confirmPassword && !passwordMatch ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        color: '#f1f5f9'
                                    }}
                                    onFocus={e => (e.target.style.borderColor = passwordMatch ? 'rgba(99,102,241,0.6)' : 'rgba(248,113,113,0.5)')}
                                    onBlur={e => (e.target.style.borderColor = confirmPassword && !passwordMatch ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)')}
                                />
                                {confirmPassword && passwordMatch && (
                                    <CheckCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2"
                                                 style={{ color: '#2dd4bf' }} />
                                )}
                            </div>
                            {confirmPassword && !passwordMatch && (
                                <p className="text-xs mt-1" style={{ color: '#f87171' }}>
                                    Паролі не співпадають
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold mt-2"
                            style={{
                                background: loading || !isValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: loading || !isValid ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading
                                ? <><Loader2 size={15} className="animate-spin" />Реєстрація…</>
                                : 'Створити компанію'
                            }
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
                        Вже є акаунт?{' '}
                        <Link to="/login" style={{ color: '#818cf8' }}>
                            Увійти
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}