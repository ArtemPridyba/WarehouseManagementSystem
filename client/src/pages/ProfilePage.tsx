import { useState } from 'react';
import { User, Lock, Loader2, Check } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { saveUserToStorage } from '../store/authStore';
import type { AuthResponse } from '../types';

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

    // Спільний клас для інпутів
    const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-[#0B0D14]/60";

    return (
        <div className="flex flex-col items-center py-8 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl space-y-6">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        Мій профіль
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Керування обліковими даними та налаштуваннями безпеки
                    </p>
                </div>

                {/* Аватар + роль */}
                <div className="rounded-xl p-6 flex items-center gap-5 bg-[#0B0D14]/40 backdrop-blur-md border border-white/[0.04] shadow-lg">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {firstName[0] || ''}{lastName[0] || ''}
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-100">{user?.fullName}</p>
                        <p className="text-sm mt-0.5 text-slate-400">{user?.email}</p>
                        <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full mt-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Редагування профілю */}
                <div className="rounded-xl p-6 bg-[#0B0D14]/40 backdrop-blur-md border border-white/[0.04] shadow-lg">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/[0.04]">
                        <User size={18} className="text-indigo-400" />
                        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Особисті дані</h2>
                    </div>

                    {profileError && (
                        <div className="rounded-lg px-4 py-3 mb-5 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            {profileError}
                        </div>
                    )}
                    {profileSuccess && (
                        <div className="rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400">
                            <Check size={16} /> Профіль успішно оновлено
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-500">Ім'я *</label>
                                <input
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-500">Прізвище *</label>
                                <input
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-slate-500">Email (не змінюється)</label>
                            <input
                                value={user?.email ?? ''}
                                disabled
                                className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/[0.01] border border-white/[0.04] text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleProfileSave}
                                disabled={profileLoading || !profileValid}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/30 disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/10"
                            >
                                {profileLoading && <Loader2 size={14} className="animate-spin" />}
                                {!profileLoading && profileSuccess && <Check size={14} />}
                                Зберегти дані
                            </button>
                        </div>
                    </div>
                </div>

                {/* Зміна паролю */}
                <div className="rounded-xl p-6 bg-[#0B0D14]/40 backdrop-blur-md border border-white/[0.04] shadow-lg">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/[0.04]">
                        <Lock size={18} className="text-indigo-400" />
                        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Безпека</h2>
                    </div>

                    {passError && (
                        <div className="rounded-lg px-4 py-3 mb-5 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300">
                            {passError}
                        </div>
                    )}
                    {passSuccess && (
                        <div className="rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400">
                            <Check size={16} /> Пароль успішно змінено
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-slate-500">Поточний пароль *</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className={inputClass}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-500">Новий пароль *</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`${inputClass} ${newPassword && newPassword.length < 6 ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                                />
                                {newPassword && newPassword.length < 6 && (
                                    <p className="text-[11px] font-medium mt-1.5 text-rose-400">Мінімум 6 символів</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-500">Підтвердіть пароль *</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`${inputClass} ${confirmPassword && confirmPassword !== newPassword ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[11px] font-medium mt-1.5 text-rose-400">Паролі не співпадають</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handlePasswordChange}
                                disabled={passLoading || !passValid}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {passLoading && <Loader2 size={14} className="animate-spin" />}
                                {!passLoading && passSuccess && <Check size={14} />}
                                Оновити пароль
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}