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

// ─── Кольори ──────────────────────────────────────────────────────────────────

const ABC_COLORS: Record<string, string> = {
    A: '#6366f1',
    B: '#2dd4bf',
    C: '#f59e0b',
};

const PIE_COLORS = ['#6366f1', '#2dd4bf', '#f59e0b', '#f87171', '#a78bfa'];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent?: string;
}

function StatCard({ label, value, icon, accent = '#6366f1' }: StatCardProps) {
    return (
        <div
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
            >
                <span style={{ color: accent }}>{icon}</span>
            </div>
            <div>
                <p className="text-xs mb-1" style={{ color: '#475569' }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>{value}</p>
            </div>
        </div>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div
            className="rounded-xl p-5"
            style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.06)' }}
        >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
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
        <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
        >
            {label !== undefined && <p className="mb-1" style={{ color: '#475569' }}>{label}</p>}
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: <span className="font-semibold">{p.value}</span>
                </p>
            ))}
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
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p style={{ color: '#f87171' }}>{error}</p>
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
        <div className="space-y-6">

            {/* Заголовок */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Дашборд</h1>
                <p className="text-sm mt-1" style={{ color: '#475569' }}>
                    Загальна статистика складу
                </p>
            </div>

            {/* Лічильники */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    label="Товарів у каталозі"
                    value={s.totalProducts}
                    icon={<Package size={20} />}
                    accent="#6366f1"
                />
                <StatCard
                    label="Одиниць на складі"
                    value={s.totalItemsCount.toLocaleString()}
                    icon={<Boxes size={20} />}
                    accent="#2dd4bf"
                />
                <StatCard
                    label="Очікується прихід"
                    value={s.pendingInboundOrders}
                    icon={<ArrowDownToLine size={20} />}
                    accent="#f59e0b"
                />
                <StatCard
                    label="Очікується відправка"
                    value={s.pendingOutboundOrders}
                    icon={<ArrowUpFromLine size={20} />}
                    accent="#a78bfa"
                />
                <StatCard
                    label="Мало на складі"
                    value={s.lowStockAlerts}
                    icon={<AlertTriangle size={20} />}
                    accent="#f87171"
                />
            </div>

            {/* Графіки — перший рядок */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ABC аналіз */}
                <Section title="ABC аналіз категорій">
                    {abc.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: '#475569' }}>Немає даних</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={abc} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="categoryName"
                                    tick={{ fill: '#475569', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#475569', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="totalQuantity" name="Кількість" radius={[4, 4, 0, 0]}>
                                    {abc.map((entry, i) => (
                                        <Cell key={i} fill={ABC_COLORS[entry.class] ?? '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    {/* Легенда класів */}
                    <div className="flex gap-4 mt-3">
                        {Object.entries(ABC_COLORS).map(([cls, color]) => (
                            <div key={cls} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                                <span className="text-xs" style={{ color: '#475569' }}>Клас {cls}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Заповненість складу */}
                <Section title="Заповненість складу">
                    {stats!.warehouseOccupancy.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: '#475569' }}>Немає даних</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={stats!.warehouseOccupancy}
                                        dataKey="occupiedLocations"
                                        nameKey="warehouseName"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={50}
                                    >
                                        {stats!.warehouseOccupancy.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Прогрес бари */}
                            <div className="space-y-3 mt-2">
                                {stats!.warehouseOccupancy.map((w, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span style={{ color: '#94a3b8' }}>{w.warehouseName}</span>
                                            <span style={{ color: '#475569' }}>
                        {w.occupiedLocations}/{w.totalLocations} ({Math.round(w.occupancyPercentage)}%)
                      </span>
                                        </div>
                                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div
                                                className="h-1.5 rounded-full transition-all"
                                                style={{
                                                    width: `${w.occupancyPercentage}%`,
                                                    background: PIE_COLORS[i % PIE_COLORS.length],
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
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={fullHeatmap} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="hour"
                            tick={{ fill: '#475569', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={1}
                        />
                        <YAxis
                            tick={{ fill: '#475569', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="операцій" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Section>

            {/* Alerts про закінчення терміну */}
            {stats!.expiryAlerts.length > 0 && (
                <Section title="⚠️ Товари з терміном придатності менше 30 днів">
                    <div className="space-y-2">
                        {stats!.expiryAlerts.map((alert, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-lg px-4 py-3"
                                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
                            >
                                <div>
                                    <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>{alert.productName}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Партія: {alert.batchNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
                                        {alert.daysRemaining} дн.
                                    </p>
                                    <p className="text-xs" style={{ color: '#475569' }}>
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