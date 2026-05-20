import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
}

export default function ConfirmModal({
                                         title,
                                         message,
                                         confirmLabel = 'Підтвердити',
                                         cancelLabel  = 'Скасувати',
                                         danger       = false,
                                         onConfirm,
                                         onClose,
                                     }: ConfirmModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function handle() {
        setError(null);
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (err: unknown) {
            const data = (err as { response?: { data?: unknown } })?.response?.data;
            setError(typeof data === 'string' ? data : (data as { title?: string })?.title ?? 'Помилка виконання');
        } finally {
            setLoading(false);
        }
    }

    const accentColor = danger ? '#f87171' : '#6366f1';
    const accentBg    = danger ? 'rgba(248,113,113,0.1)' : 'rgba(99,102,241,0.1)';
    const accentBorder = danger ? 'rgba(248,113,113,0.2)' : 'rgba(99,102,241,0.2)';
    const buttonBg    = danger ? '#ef4444' : '#6366f1';
    const buttonBgDis = danger ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.4)';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-xl p-6"
                 style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Іконка */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                        {danger
                            ? <Trash2 size={18} style={{ color: accentColor }} />
                            : <AlertTriangle size={18} style={{ color: accentColor }} />
                        }
                    </div>
                    <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                        {title}
                    </h2>
                </div>

                <p className="text-sm mb-5 leading-relaxed" style={{ color: '#94a3b8' }}>
                    {message}
                </p>

                {error && (
                    <div className="rounded-lg px-3 py-2 mb-4 text-sm"
                         style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handle}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                        style={{
                            background: loading ? buttonBgDis : buttonBg,
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}