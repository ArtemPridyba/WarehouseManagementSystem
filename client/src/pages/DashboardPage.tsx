import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    Package, ArrowDownToLine, ArrowUpFromLine,
    AlertTriangle, Boxes, Loader2,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import type {
    DashboardStatsResponse,
    AbcAnalysisDto,
    LocationUtilizationDto,
    HourlyActivityDto,
} from '../types';

// ─── Кольори для графіків ──────────────────────────────────────────────────────

const ABC_COLORS: Record<string, string> = {
    A: '#6366f1', // indigo-500
    B: '#2dd4bf', // teal-400
    C: '#f59e0b', // amber-500
};

const PIE_COLORS = ['#6366f1', '#2dd4bf', '#f59e0b', '#f87171', '#a78bfa'];

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/5' },
    teal:   { text: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   glow: 'shadow-teal-500/5' },
    amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  glow: 'shadow-amber-500/5' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-purple-500/5' },
    rose:   { text: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   glow: 'shadow-rose-500/5' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    variant?: 'indigo' | 'teal' | 'amber' | 'purple' | 'rose';
}

function StatCard({ label, value, icon, variant = 'indigo' }: StatCardProps) {
    const config = COLOR_MAP[variant];

    return (
        <div className="rounded-xl p-5 flex items-center gap-4 bg-[#0B0D14]/40 backdrop-blur-md border border-white/[0.04] shadow-lg transition-all duration-300 hover:border-white/10 hover:-translate-y-0.5">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${config.bg} ${config.border} ${config.text} ${config.glow}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 truncate mb-1">{label}</p>
                <p className="text-2xl font-bold text-slate-100 tracking-tight truncate">{value}</p>
            </div>
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl p-5 bg-[#0B0D14]/40 backdrop-blur-md border border-white/[0.04] shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 mb-5">
                {title}
            </h3>
            {children}
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg px-3 py-2 text-xs bg-[#0F111A]/90 backdrop-blur-md border border-white/10 shadow-xl">
            {label !== undefined && <p className="text-slate-500 mb-1.5 font-medium">{label}</p>}
            <div className="space-y-1">
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}:</span>
                        <span className="font-semibold text-slate-200">{p.value}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [abc, setAbc] = useState<AbcAnalysisDto[]>([]);
    const [, setUtilization] = useState<LocationUtilizationDto[]>([]);
    const [heatmap, setHeatmap] = useState<HourlyActivityDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [s, a, u, h] = await Promise.all([
                    dashboardService.getSummary(),
                    dashboardService.getAbcAnalysis(),
                    dashboardService.getUtilization(),
                    dashboardService.getHeatmap(),
                ]);
                setStats(s);
                setAbc(a);
                setUtilization(u);
                setHeatmap(h);
            } catch {
                setError('Не вдалося завантажити дані дашборду');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
                <Loader2 size={36} className="animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500 animate-pulse">Завантаження аналітики...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 border border-rose-500/10 bg-rose-500/5 rounded-xl p-6">
                <p className="text-sm font-medium text-rose-400">{error}</p>
            </div>
        );
    }

    const s = stats!.summary;

    // Heatmap — заповнюємо всі 24 години
    const fullHeatmap = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        операцій: heatmap.find(h => h.hour === i)?.moveCount ?? 0,
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Заголовок */}
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-100">Дашборд</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Загальна статистика та аналітика складу в реальному часі
                </p>
            </div>

            {/* Лічильники */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    label="Товарів у каталозі"
                    value={s.totalProducts}
                    icon={<Package size={20} />}
                    variant="indigo"
                />
                <StatCard
                    label="Одиниць на складі"
                    value={s.totalItemsCount.toLocaleString()}
                    icon={<Boxes size={20} />}
                    variant="teal"
                />
                <StatCard
                    label="Очікується прихід"
                    value={s.pendingInboundOrders}
                    icon={<ArrowDownToLine size={20} />}
                    variant="amber"
                />
                <StatCard
                    label="Очікується відправка"
                    value={s.pendingOutboundOrders}
                    icon={<ArrowUpFromLine size={20} />}
                    variant="purple"
                />
                <StatCard
                    label="Мало на складі"
                    value={s.lowStockAlerts}
                    icon={<AlertTriangle size={20} />}
                    variant="rose"
                />
            </div>

            {/* Графіки — перший рядок */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ABC аналіз */}
                <Section title="ABC аналіз категорій">
                    {abc.length === 0 ? (
                        <p className="text-sm text-center text-slate-500 py-16">Немає даних для аналізу</p>
                    ) : (
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={abc} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                                    <XAxis
                                        dataKey="categoryName"
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Bar dataKey="totalQuantity" name="Кількість" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {abc.map((entry, i) => (
                                            <Cell key={i} fill={`url(#abcGlow-${entry.class})`} />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="abcGlow-A" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="abcGlow-B" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="abcGlow-C" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                            {/* Легенда класів */}
                            <div className="flex gap-4 mt-2 pt-3 border-t border-white/[0.02]">
                                {Object.entries(ABC_COLORS).map(([cls, color]) => (
                                    <div key={cls} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
                                        <span className="text-xs font-medium text-slate-400">Клас {cls}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Section>

                {/* Заповненість складу — Фікс обрізання графіка */}
                <Section title="Заповненість складу">
                    {stats!.warehouseOccupancy.length === 0 ? (
                        <p className="text-sm text-center text-slate-500 py-16">Немає даних про заповненість</p>
                    ) : (
                        <>
                            {/* Додано фіксовану висоту контейнера та чіткі внутрішні відступи (margin) */}
                            <div className="h-[190px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                        <Pie
                                            data={stats!.warehouseOccupancy}
                                            dataKey="occupiedLocations"
                                            nameKey="warehouseName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={68}
                                            innerRadius={48}
                                            paddingAngle={3}
                                        >
                                            {stats!.warehouseOccupancy.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={32}
                                            iconType="circle"
                                            iconSize={6}
                                            formatter={(value) => (
                                                <span className="text-xs font-medium text-slate-400 ml-1">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Прогрес бари */}
                            <div className="space-y-3.5 mt-4 pt-4 border-t border-white/[0.02]">
                                {stats!.warehouseOccupancy.map((w, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">{w.warehouseName}</span>
                                            <span className="text-slate-500 font-medium">
                                                {w.occupiedLocations} <span className="text-slate-600">/</span> {w.totalLocations} ({Math.round(w.occupancyPercentage)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden border border-white/[0.02]">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${w.occupancyPercentage}%`,
                                                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Section>
            </div>

            {/* Активність по годинах */}
            <Section title="Активність за останні 7 днів (по годинах)">
                <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fullHeatmap} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                            <XAxis
                                dataKey="hour"
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval={1}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                            <Bar dataKey="операцій" fill="url(#indigoGlow)" radius={[3, 3, 0, 0]} maxBarSize={30} />
                            <defs>
                                <linearGradient id="indigoGlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Section>

            {/* Alerts про закінчення терміну */}
            {stats!.expiryAlerts.length > 0 && (
                <Section title="⚠️ Товари з терміном придатності менше 30 днів">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats!.expiryAlerts.map((alert, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-lg px-4 py-3 bg-rose-500/[0.02] border border-rose-500/10 hover:bg-rose-500/[0.05] hover:border-rose-500/20 transition-all duration-200"
                            >
                                <div className="min-w-0 flex-1 pr-4">
                                    <p className="text-sm font-semibold text-rose-300 truncate">{alert.productName}</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">Партія: <span className="text-slate-400 font-medium">{alert.batchNumber}</span></p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-rose-400">
                                        {alert.daysRemaining} дн.
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                        {new Date(alert.expirationDate).toLocaleDateString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}