import { useState } from 'react';
import { User, Lock, Loader2, Check } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { saveUserToStorage } from '../store/authStore';
import type { AuthResponse } from '../types';

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
};

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl p-6"
             style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-5"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
                <span style={{ color: '#6366f1' }}>{icon}</span>
                <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{title}</h2>
            </div>
            {children}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user, login } = useAuth();

    // Профіль
    const [firstName, setFirstName] = useState(user?.fullName?.split(' ')[0] ?? '');
    const [lastName, setLastName]   = useState(user?.fullName?.split(' ').slice(1).join(' ') ?? '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError]     = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Пароль
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading]         = useState(false);
    const [passError, setPassError]             = useState<string | null>(null);
    const [passSuccess, setPassSuccess]         = useState(false);

    async function handleProfileSave() {
        setProfileError(null);
        setProfileSuccess(false);
        setProfileLoading(true);
        try {
            const response: AuthResponse = await authService.updateProfile({ firstName, lastName });
            // Оновлюємо токен і user в localStorage
            const updated = saveUserToStorage(response);
            login(updated);
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setProfileError(typeof data === 'string' ? data : 'Помилка збереження');
        } finally {
            setProfileLoading(false);
        }
    }

    async function handlePasswordChange() {
        setPassError(null);
        setPassSuccess(false);
        if (newPassword !== confirmPassword) {
            setPassError('Паролі не співпадають');
            return;
        }
        if (newPassword.length < 6) {
            setPassError('Пароль має бути мінімум 6 символів');
            return;
        }
        setPassLoading(true);
        try {
            await authService.changePassword({ currentPassword, newPassword });
            setPassSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPassSuccess(false), 3000);
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setPassError(typeof data === 'string' ? data : 'Помилка зміни паролю');
        } finally {
            setPassLoading(false);
        }
    }

    const profileValid = firstName.trim() && lastName.trim();
    const passValid    = currentPassword && newPassword && confirmPassword;

    return (
        <div className="space-y-6 max-w-2xl">

            <div>
                <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Профіль</h1>
                <p className="text-sm mt-1" style={{ color: '#475569' }}>
                    Керування особистими даними та паролем
                </p>
            </div>

            {/* Аватар + роль */}
            <div className="rounded-xl p-5 flex items-center gap-4"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                     style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {firstName[0]}{lastName[0]}
                </div>
                <div>
                    <p className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        {user?.fullName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{user?.email}</p>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1.5"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Редагування профілю */}
            <Section title="Особисті дані" icon={<User size={16} />}>
                {profileError && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {profileError}
                    </div>
                )}
                {profileSuccess && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm flex items-center gap-2"
                         style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
                        <Check size={14} /> Профіль успішно оновлено
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Ім'я *
                            </label>
                            <input
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Прізвище *
                            </label>
                            <input
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Email
                        </label>
                        <input
                            value={user?.email ?? ''}
                            disabled
                            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                        />
                        <p className="text-xs mt-1" style={{ color: '#334155' }}>
                            Email змінити неможливо
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleProfileSave}
                            disabled={profileLoading || !profileValid}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                            style={{
                                background: profileLoading || !profileValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: profileLoading || !profileValid ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {profileLoading
                                ? <Loader2 size={14} className="animate-spin" />
                                : profileSuccess
                                    ? <Check size={14} />
                                    : null}
                            Зберегти зміни
                        </button>
                    </div>
                </div>
            </Section>

            {/* Зміна паролю */}
            <Section title="Зміна паролю" icon={<Lock size={16} />}>
                {passError && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {passError}
                    </div>
                )}
                {passSuccess && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm flex items-center gap-2"
                         style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
                        <Check size={14} /> Пароль успішно змінено
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                            Поточний пароль *
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Новий пароль *
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    ...inputStyle,
                                    borderColor: newPassword && newPassword.length < 6
                                        ? 'rgba(248,113,113,0.6)'
                                        : 'rgba(255,255,255,0.1)',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = newPassword && newPassword.length < 6
                                    ? 'rgba(248,113,113,0.6)'
                                    : 'rgba(255,255,255,0.1)')}
                            />
                            {newPassword && newPassword.length < 6 && (
                                <p className="text-xs mt-1" style={{ color: '#f87171' }}>Мінімум 6 символів</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#94a3b8' }}>
                                Підтвердити пароль *
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    ...inputStyle,
                                    borderColor: confirmPassword && confirmPassword !== newPassword
                                        ? 'rgba(248,113,113,0.6)'
                                        : 'rgba(255,255,255,0.1)',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                                onBlur={e => (e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword
                                    ? 'rgba(248,113,113,0.6)'
                                    : 'rgba(255,255,255,0.1)')}
                            />
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-xs mt-1" style={{ color: '#f87171' }}>Паролі не співпадають</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handlePasswordChange}
                            disabled={passLoading || !passValid}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                            style={{
                                background: passLoading || !passValid ? 'rgba(99,102,241,0.4)' : '#6366f1',
                                color: '#fff',
                                cursor: passLoading || !passValid ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {passLoading
                                ? <Loader2 size={14} className="animate-spin" />
                                : passSuccess
                                    ? <Check size={14} />
                                    : null}
                            Змінити пароль
                        </button>
                    </div>
                </div>
            </Section>
        </div>
    );
}