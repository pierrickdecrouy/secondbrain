import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { BookOpen, Brain, ChartBar, ClockCounterClockwise, Lightning, X, Timer, CheckCircle, TrendUp } from '@phosphor-icons/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { LeechHunter } from './LeechHunter';

import { useCardStore as useCards } from '../store/useCardStore';
import { useDueCards } from '../hooks/useDueCards';

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue =>
    typeof value === 'object' && value !== null && 'count' in value;

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export const StatsPage: React.FC = () => {
    const { cards } = useCards();
    const { dueCards, learningCards, newCards } = useDueCards(cards);
    const navigate = useNavigate();

    const {
        heatmapValues,
        retentionRate,
        leechCards,
        matureCards,
        estimatedReviewTimeMin,
        avgStability,
    } = useMemo(() => {
        const { heatmapValues } = (() => {
            const heatmapDataMap = new Map<string, number>();
            cards.forEach((card) => {
                const effectiveCreate = (card.createdAt && card.createdAt > 0) ? card.createdAt : card.updatedAt;
                const createDay = effectiveCreate ? new Date(effectiveCreate).toISOString().split('T')[0] : null;
                if (createDay) {
                    heatmapDataMap.set(createDay, (heatmapDataMap.get(createDay) || 0) + 1);
                }
                if (card.progress?.history) {
                    card.progress.history.forEach(reviewDateIso => {
                        const day = new Date(reviewDateIso).toISOString().split('T')[0];
                        heatmapDataMap.set(day, (heatmapDataMap.get(day) || 0) + 1);
                    });
                }
            });
            const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));
            return { heatmapValues };
        })();

        const leechCards = cards.filter(c => c.progress?.isLeech || c.progress?.status === 'suspended').length;
        const matureCards = cards.filter(c => (c.progress?.interval || 0) >= 21).length;
        const estimatedReviewTimeMin = Math.ceil((dueCards.length * 15) / 60);

        let sumRetrievability = 0;
        let cardsWithRetrievability = 0;
        const nowMs = Date.now();

        let sumStability = 0;
        let sumDifficulty = 0;
        let cardsWithFSRS = 0;
        
        cards.forEach(c => {
            if (c.progress?.stability) {
                sumStability += c.progress.stability;
                sumDifficulty += (c.progress.difficulty || 0);
                cardsWithFSRS++;
                
                if (c.progress.lastReview) {
                    const elapsedDays = Math.max(0, (nowMs - new Date(c.progress.lastReview).getTime()) / (1000 * 60 * 60 * 24));
                    const R = Math.exp(Math.log(0.9) * elapsedDays / c.progress.stability);
                    sumRetrievability += Math.max(0, Math.min(1, R));
                    cardsWithRetrievability++;
                }
            }
        });
        
        const retentionRate = cardsWithRetrievability > 0 ? sumRetrievability / cardsWithRetrievability : 0;
        const avgStability = cardsWithFSRS > 0 ? (sumStability / cardsWithFSRS).toFixed(1) : 'N/A';
        const avgDifficulty = cardsWithFSRS > 0 ? (sumDifficulty / cardsWithFSRS).toFixed(1) : 'N/A';

        return { heatmapValues, retentionRate, leechCards, matureCards, estimatedReviewTimeMin, avgStability, avgDifficulty };
    }, [cards, dueCards.length]);

    const byType = useMemo(() => {
        const counts: Record<string, number> = {};
        cards.forEach(c => {
            counts[c.type] = (counts[c.type] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [cards]);

    const forecastData = useMemo(() => {
        const forecast: Record<string, number> = {};
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            forecast[d.toLocaleDateString('fr-FR', { weekday: 'short' })] = 0;
        }

        cards.forEach(c => {
            if (c.progress?.dueDate) {
                const due = new Date(c.progress.dueDate);
                due.setHours(0,0,0,0);
                const diffTime = due.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays < 7) {
                    const label = due.toLocaleDateString('fr-FR', { weekday: 'short' });
                    if (forecast[label] !== undefined) {
                        forecast[label]++;
                    }
                }
            }
        });
        
        return Object.entries(forecast).map(([day, count]) => ({ day, count }));
    }, [cards]);

    const reviewedRatio = cards.length > 0 ? (cards.length - newCards.length) / cards.length : 0;

    const startDate = new Date();
    startDate.setDate(1); 
    startDate.setMonth(startDate.getMonth() - 6);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl shadow-xl flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{payload[0].name || payload[0].payload.day}</span>
                    <span className="text-sm font-medium" style={{ color: payload[0].color || COLORS[0] }}>
                        {payload[0].value} cartes
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex-1 overflow-y-auto w-full h-full bg-slate-50 dark:bg-[#09090b] px-4 sm:px-8 pt-8 pb-[calc(1rem+68px+env(safe-area-inset-bottom))] md:pb-8 flex flex-col">
            <style>
                {`
                /* Overrides for react-calendar-heatmap */
                .react-calendar-heatmap rect {
                    rx: 3;
                    ry: 3;
                }
                .react-calendar-heatmap text {
                    fill: #94a3b8;
                    font-size: 8px;
                }
                :is(.dark *) .react-calendar-heatmap text {
                    fill: #475569;
                }
                `}
            </style>

            <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 gap-10">
                {/* Header */}
                <header className="app-drag-region flex items-center gap-4">
                    <div className="app-no-drag w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                        <ChartBar size={24} weight="duotone" />
                    </div>
                    <div className="app-no-drag">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white m-0">Statistiques & Progression</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0 mt-0.5">Suivez l'efficacité de vos révisions FSRS</p>
                    </div>
                </header>

                {cards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
                        <div className="w-24 h-24 bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-6">
                            <ChartBar size={48} weight="duotone" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Statistiques à venir</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">
                            Commencez à réviser pour voir vos statistiques. Vos progrès s'afficheront ici.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10 pb-10">
                        {/* KPI Grid */}
                        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">
                                    <BookOpen size={18} weight="bold" /> Total Fiches
                                </div>
                                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{cards.length}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 text-sm font-bold uppercase tracking-wider mb-3">
                                    <Brain size={18} weight="bold" /> Apprentissage
                                </div>
                                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">{learningCards.length}</div>
                            </div>

                            <div className="bg-emerald-500 text-white rounded-3xl p-5 shadow-lg shadow-emerald-500/20">
                                <div className="flex items-center gap-2 text-emerald-100 text-sm font-bold uppercase tracking-wider mb-3">
                                    <ClockCounterClockwise size={18} weight="bold" /> À Revoir
                                </div>
                                <div className="text-4xl font-extrabold">{dueCards.length}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 text-sm font-bold uppercase tracking-wider mb-3">
                                    <Timer size={18} weight="bold" /> Temps Estimé
                                </div>
                                <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                    {estimatedReviewTimeMin > 0 ? `${estimatedReviewTimeMin}m` : '0m'}
                                </div>
                            </div>
                        </section>

                        {/* Secondary FSRS KPIs */}
                        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                                    <CheckCircle size={14} weight="bold" /> Fiches Matures
                                </div>
                                <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{matureCards}</div>
                            </div>
                            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                                    <TrendUp size={14} weight="bold" /> Rétention Est.
                                </div>
                                <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{asPercent(retentionRate)}</div>
                            </div>
                            <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/50 rounded-2xl p-4 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                                    <Lightning size={14} weight="bold" /> Stabilité Moy.
                                </div>
                                <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{avgStability} j</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-1">
                                    <X size={14} weight="bold" /> Cartes Critiques
                                </div>
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{leechCards}</div>
                            </div>
                        </section>

                        {/* Main Charts */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Forecast Chart */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Prévisions (7 jours)</h3>
                                <div className="flex-1 min-h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Category Pie Chart */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[350px]">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Répartition par Catégorie</h3>
                                <div className="flex-1 min-h-[200px] w-full flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex-1 min-w-0 min-h-[200px] h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={byType}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="55%"
                                                    outerRadius="80%"
                                                    paddingAngle={4}
                                                    cornerRadius={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {byType.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-row sm:flex-col flex-wrap justify-center gap-3 shrink-0">
                                        {byType.map((entry, index) => (
                                            <div key={entry.name} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{entry.name}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white ml-auto">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Activity Heatmap & Progress */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activité (6 derniers mois)</h3>
                                <div className="w-full overflow-x-auto pb-2 flex-1">
                                    <div className="min-w-[600px] h-full">
                                        <CalendarHeatmap
                                            startDate={startDate}
                                            endDate={new Date()}
                                            values={heatmapValues}
                                            classForValue={(value) => {
                                                if (!value) return 'fill-slate-100 dark:fill-slate-800/50';
                                                const count = hasHeatmapCount(value) ? value.count || 0 : 0;
                                                if (count === 1) return 'fill-emerald-200 dark:fill-emerald-900/60';
                                                if (count === 2) return 'fill-emerald-400 dark:fill-emerald-700/80';
                                                if (count === 3) return 'fill-emerald-500 dark:fill-emerald-500';
                                                return 'fill-emerald-600 dark:fill-emerald-400';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Progression globale</h3>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Fiches découvertes</span>
                                        <strong className="text-3xl font-extrabold text-slate-900 dark:text-white">{asPercent(reviewedRatio)}</strong>
                                    </div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: asPercent(reviewedRatio) }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Leech Hunter */}
                        <LeechHunter cards={cards} onNavigate={(id) => navigate(`/browse?searchQuery=${encodeURIComponent(id)}`)} />
                    </div>
                )}
            </div>
        </div>
    );
};
