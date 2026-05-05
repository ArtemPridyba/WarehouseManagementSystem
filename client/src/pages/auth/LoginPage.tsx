import { useState, type FormEvent } from 'react';
import { Package, Loader2, AlertCircle } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function LoginPage() {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const { execute: loginUser } = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await loginUser({ email, password });
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? 'Не вдалося увійти. Перевірте дані.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex" style={{ background: '#0f1117' }}>

            {/* Ліва панель */}
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
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)'
                    }}>
                        <Package size={18} style={{ color: '#818cf8' }} />
                    </div>
                    <span className="text-white font-semibold tracking-tight text-lg">WMS Pro</span>
                </div>

                {/* Текст */}
                <div className="relative">
                    <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6366f1' }}>
                        Складська система
                    </p>
                    <h1 className="text-4xl font-bold leading-tight mb-6" style={{ color: '#f1f5f9' }}>
                        Контроль залишків.<br />
                        Точність операцій.<br />
                        <span style={{ color: '#818cf8' }}>Ефективність бізнесу.</span>
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                        Мультитенантна платформа для управління складом —
                        від приймання товару до відвантаження клієнтам.
                    </p>
                </div>

                {/* Статистика */}
                <div className="relative flex gap-8">
                    {[
                        { label: 'Складів', value: '∞' },
                        { label: 'Операцій/день', value: '10K+' },
                        { label: 'Ізоляція даних', value: '100%' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>{value}</p>
                            <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Права панель — форма */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">

                    {/* Мобільне лого */}
                    <div className="flex lg:hidden items-center gap-3 mb-10">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)'
                        }}>
                            <Package size={16} style={{ color: '#818cf8' }} />
                        </div>
                        <span className="text-white font-semibold">WMS Pro</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
                        Вхід до системи
                    </h2>
                    <p className="text-sm mb-8" style={{ color: '#475569' }}>
                        Введіть корпоративний email та пароль
                    </p>

                    {/* Помилка */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-lg p-3 mb-6" style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                            <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#f87171' }} />
                            <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@company.com"
                                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Пароль
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                                onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all mt-2"
                            style={{
                                background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1',
                                color: '#fff',
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading
                                ? <><Loader2 size={15} className="animate-spin" />Вхід…</>
                                : 'Увійти'
                            }
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
                        Нова компанія?{' '}
                        <Link to="/register" style={{ color: '#818cf8' }}>Зареєструватись</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}