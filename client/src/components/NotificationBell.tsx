import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, Package, Truck, ArrowLeftRight, SlidersHorizontal, Hash } from 'lucide-react';
import { workOrderService } from '../services/workorder.service';
import type { NotificationItem, NotificationsDto } from '../types';
import { WORK_ORDER_TYPE_LABELS, WORK_ORDER_PRIORITY_COLORS } from '../types';
import type { WorkOrderType } from '../types';

const TYPE_ICONS: Record<WorkOrderType, React.ReactElement> = {
    Receive:  <Package size={13} />,
    Ship:     <Truck size={13} />,
    Transfer: <ArrowLeftRight size={13} />,
    Adjust:   <SlidersHorizontal size={13} />,
    Count:    <Hash size={13} />,
};

const POLL_INTERVAL = 30_000;

export default function NotificationBell() {
    const [data, setData]       = useState<NotificationsDto>({ totalCount: 0, items: [] });
    const [open, setOpen]       = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef           = useRef<HTMLDivElement>(null);
    const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const result = await workOrderService.getNotifications();
            setData(result);
        } catch { /* empty */ }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function initFetch() {
            try {
                const result = await workOrderService.getNotifications();
                if (isMounted) {
                    setData(result);
                }
            } catch { /* empty */ }
        }

        void initFetch();

        intervalRef.current = setInterval(() => {
            void fetchNotifications();
        }, POLL_INTERVAL);

        return () => {
            isMounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    async function handleOpen() {
        setOpen(p => !p);
        if (!open) {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        }
    }

    const hasNew = data.totalCount > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-lg transition-all"
                style={{
                    background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: open ? '#818cf8' : '#475569',
                }}
                onMouseEnter={e => {
                    if (!open) {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }
                }}
                onMouseLeave={e => {
                    if (!open) {
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }
                }}
            >
                <Bell size={16} />
                {hasNew && (
                    <span
                        className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{
                            minWidth: 16,
                            height: 16,
                            padding: '0 4px',
                            background: '#f87171',
                            color: '#fff',
                            fontSize: 10,
                        }}
                    >
                        {data.totalCount > 9 ? '9+' : data.totalCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 rounded-xl overflow-hidden"
                    style={{
                        width: 320,
                        background: '#13151f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        zIndex: 100,
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3"
                         style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                            <Bell size={14} style={{ color: '#6366f1' }} />
                            <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                                Сповіщення
                            </span>
                            {hasNew && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                      style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                                    {data.totalCount} нових
                                </span>
                            )}
                        </div>
                        <button onClick={() => setOpen(false)} style={{ color: '#475569' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                                     style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
                            </div>
                        ) : data.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <Bell size={24} style={{ color: '#1e293b' }} />
                                <p className="text-sm" style={{ color: '#334155' }}>
                                    Нових завдань немає
                                </p>
                            </div>
                        ) : (
                            data.items.map(item => (
                                <NotificationRow key={item.id} item={item} />
                            ))
                        )}
                    </div>

                    {data.items.length > 0 && (
                        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <a
                                href="/tasks"
                                onClick={() => setOpen(false)}
                                className="block text-center text-xs font-medium py-2 rounded-lg transition-all"
                                style={{
                                    background: 'rgba(99,102,241,0.1)',
                                    color: '#818cf8',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                }}
                            >
                                Переглянути всі завдання
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function NotificationRow({ item }: { item: NotificationItem }) {
    const priorityColor = WORK_ORDER_PRIORITY_COLORS[item.priority as keyof typeof WORK_ORDER_PRIORITY_COLORS]
        ?? '#475569';

    return (
        <div
            className="px-4 py-3 transition-all"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                     style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                    {TYPE_ICONS[item.type as WorkOrderType] ?? <Bell size={13} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                        {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: '#475569' }}>
                            {WORK_ORDER_TYPE_LABELS[item.type as WorkOrderType]}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                  background: `${priorityColor}15`,
                                  color: priorityColor,
                              }}>
                            {item.priority}
                        </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#334155' }}>
                        {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                    </p>
                </div>

                {item.isUrgent && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5 animate-pulse"
                         style={{ background: '#f87171' }} />
                )}
            </div>
        </div>
    );
}