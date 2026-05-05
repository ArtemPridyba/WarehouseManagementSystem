import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Warehouse,
    Package,
    ArrowDownToLine,
    ArrowUpFromLine,
    Users,
    LogOut,
    Menu,
    X,
    ChevronRight,
} from 'lucide-react';
import { useAuth, useLogout, useRole } from '../hooks/useAuth';

// ─── Навігаційні пункти ───────────────────────────────────────────────────────

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard', label: 'Дашборд',      icon: <LayoutDashboard size={18} /> },
    { to: '/warehouse', label: 'Топологія',     icon: <Warehouse size={18} /> },
    { to: '/products',  label: 'Товари',        icon: <Package size={18} /> },
    { to: '/inbound',   label: 'Прихід',        icon: <ArrowDownToLine size={18} /> },
    { to: '/outbound',  label: 'Відвантаження', icon: <ArrowUpFromLine size={18} /> },
    { to: '/users',     label: 'Користувачі',   icon: <Users size={18} />, adminOnly: true },
];

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function MainLayout() {
    const { user } = useAuth();
    const { execute: logout } = useLogout();
    const { isAdmin } = useRole();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>

            {/* ── Mobile overlay ─────────────────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-20 lg:hidden"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside
                className={`
                    fixed lg:relative z-30 flex flex-col h-full transition-all duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'w-16' : 'w-60'}
                `}
                style={{ background: '#13151f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
                {/* Лого */}
                <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                        <Package size={16} style={{ color: '#818cf8' }} />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-sm tracking-tight" style={{ color: '#f1f5f9' }}>
                            WMS Pro
                        </span>
                    )}

                    {/* Collapse button — тільки desktop */}
                    <button
                        onClick={() => setCollapsed(p => !p)}
                        className="hidden lg:flex ml-auto rounded-md p-1 transition-colors"
                        style={{ color: '#475569' }}
                    >
                        <ChevronRight
                            size={16}
                            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}
                        />
                    </button>
                </div>

                {/* Навігація */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {visibleItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                                ${isActive
                                ? 'text-white'
                                : 'hover:text-white'
                            }
                            `}
                            style={({ isActive }) => ({
                                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: isActive ? '#a5b4fc' : '#475569',
                                border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                            })}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Юзер + логаут */}
                <div className="px-2 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {!collapsed && (
                        <div className="px-3 py-2 mb-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <p className="text-xs font-medium truncate" style={{ color: '#f1f5f9' }}>
                                {user?.fullName}
                            </p>
                            <p className="text-xs truncate mt-0.5" style={{ color: '#475569' }}>
                                {user?.email}
                            </p>
                            <span
                                className="inline-block text-xs px-2 py-0.5 rounded-full mt-1.5"
                                style={{
                                    background: isAdmin ? 'rgba(99,102,241,0.15)' : 'rgba(20,184,166,0.15)',
                                    color: isAdmin ? '#818cf8' : '#2dd4bf',
                                }}
                            >
                                {user?.role}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                        style={{ color: '#475569' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                        <LogOut size={18} className="shrink-0" />
                        {!collapsed && <span>Вийти</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main area ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <header
                    className="flex items-center gap-4 px-6 py-4 shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#13151f' }}
                >
                    {/* Mobile burger */}
                    <button
                        className="lg:hidden p-1 rounded-md"
                        style={{ color: '#475569' }}
                        onClick={() => setMobileOpen(p => !p)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex-1" />

                    {/* Tenant badge */}
                    <div
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
                    >
                        <span>Tenant:</span>
                        <span style={{ color: '#94a3b8' }}>{user?.tenantId?.slice(0, 8)}…</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}