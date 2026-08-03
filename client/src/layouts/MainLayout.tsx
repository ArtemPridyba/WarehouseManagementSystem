import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    Boxes,
    ClipboardList,
    History,
    Building2,
} from 'lucide-react';
import { useAuth, useLogout, useRole } from '../hooks/useAuth';
import NotificationBell from "../components/NotificationBell.tsx";

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    hideForWorker?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard',    label: 'Дашборд',       icon: <LayoutDashboard size={18} />, hideForWorker: true },
    { to: '/tasks',        label: 'Завдання',      icon: <ClipboardList size={18} /> },
    { to: '/warehouse',    label: 'Топологія',     icon: <Warehouse size={18} /> },
    { to: '/inventory',    label: 'Інвентаризація',icon: <Boxes size={18} /> },
    { to: '/transactions', label: 'Історія',       icon: <History size={18} /> },
    { to: '/products',     label: 'Товари',        icon: <Package size={18} />, hideForWorker: true },
    { to: '/inbound',      label: 'Прихід',        icon: <ArrowDownToLine size={18} /> },
    { to: '/outbound',     label: 'Відвантаження', icon: <ArrowUpFromLine size={18} /> },
    { to: '/users',        label: 'Користувачі',   icon: <Users size={18} />, adminOnly: true },
];

const ROLE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    Admin:   { bg: 'bg-indigo-500/15',  text: 'text-indigo-400', label: 'Адмін' },
    Manager: { bg: 'bg-amber-500/15',   text: 'text-amber-400',  label: 'Менеджер' },
    Worker:  { bg: 'bg-teal-500/15',    text: 'text-teal-400',   label: 'Комірник' },
};

export default function MainLayout() {
    const { user } = useAuth();
    const { execute: logout } = useLogout();
    const { isAdmin } = useRole();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const visibleItems = NAV_ITEMS.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.hideForWorker && user?.role === 'Worker') return false;
        return true;
    });

    const roleConfig = ROLE_CONFIG[user?.role ?? 'Worker'] ?? ROLE_CONFIG.Worker;

    return (
        <div className={`relative h-screen overflow-hidden grid bg-slate-950 text-slate-200 transition-all duration-300 ${collapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[240px_1fr]'}`}>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:relative top-0 left-0 z-30 flex flex-col h-full transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    w-64 lg:w-full bg-[#0B0D14]/80 backdrop-blur-xl border-r border-white/[0.04] shadow-2xl
                `}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.04] shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <Package size={16} className="text-indigo-400" />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-sm tracking-wide text-slate-100">
                            WMS Pro
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(p => !p)}
                        className="hidden lg:flex ml-auto rounded-md p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                    >
                        <ChevronRight
                            size={16}
                            className={`transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {visibleItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border
                                ${isActive
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.05)]'
                                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'}
                            `}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer / User Profile */}
                <div className="px-3 py-4 border-t border-white/[0.04] shrink-0">
                    {!collapsed && (
                        <div
                            className="px-3 py-2.5 mb-3 rounded-lg bg-white/[0.02] border border-white/[0.02] hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all cursor-pointer group"
                            onClick={() => navigate('/profile')}
                        >
                            <p className="text-sm font-medium truncate text-slate-200 group-hover:text-indigo-200 transition-colors">
                                {user?.fullName || 'Користувач'}
                            </p>
                            <p className="text-xs truncate mt-0.5 text-slate-500">
                                {user?.email || 'user@email.com'}
                            </p>
                            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-2 ${roleConfig.bg} ${roleConfig.text}`}>
                                {roleConfig.label}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                        <LogOut size={18} className="shrink-0" />
                        {!collapsed && <span>Вийти</span>}
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Navbar / Header */}
                <header className="h-16 flex items-center gap-4 px-6 shrink-0 bg-[#0B0D14]/60 backdrop-blur-xl border-b border-white/[0.04] sticky top-0 z-20">
                    <button
                        className="lg:hidden p-1.5 rounded-md text-slate-400 hover:bg-white/5 transition-colors"
                        onClick={() => setMobileOpen(p => !p)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex-1" />

                    <NotificationBell />

                    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-wide uppercase ${roleConfig.bg} ${roleConfig.text}`}>
                        {roleConfig.label}
                    </div>

                    <button
                        onClick={() => navigate('/tenant')}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-white/[0.02] border border-white/[0.05] hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all shadow-sm"
                    >
                        <Building2 size={14} />
                        <span>Tenant:</span>
                        <span className="text-slate-500">{user?.tenantId?.slice(0, 8) || '29192cc1...'}</span>
                    </button>
                </header>

                {/* Main Dynamic Router Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-[1700px] mx-auto w-full animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}