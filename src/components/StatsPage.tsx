import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { BookOpen, Brain, ChartBar, ClockCounterClockwise, Lightning, X, Timer, CheckCircle } from '@phosphor-icons/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { LeechHunter } from './LeechHunter';

import { useCardStore as useCards } from '../store/useCardStore';
import { useDueCards } from '../hooks/useDueCards';
import './styles/StatsPage.css';

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue =>
    typeof value === 'object' && value !== null && 'count' in value;

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

const COLORS = ['#4fb286', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

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
                // M-4 fix: for old cards with createdAt=0 or missing, fall back to updatedAt
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
        let cardsWithStability = 0;
        
        cards.forEach(c => {
            if (c.progress?.stability) {
                sumStability += c.progress.stability;
                cardsWithStability++;
                
                if (c.progress.lastReview) {
                    const elapsedDays = Math.max(0, (nowMs - new Date(c.progress.lastReview).getTime()) / (1000 * 60 * 60 * 24));
                    // FSRS Retrievability formula: 90% retention at elapsed == stability
                    const R = Math.exp(Math.log(0.9) * elapsedDays / c.progress.stability);
                    sumRetrievability += Math.max(0, Math.min(1, R));
                    cardsWithRetrievability++;
                }
            }
        });
        
        const retentionRate = cardsWithRetrievability > 0 ? sumRetrievability / cardsWithRetrievability : 0;
        const avgStability = cardsWithStability > 0 ? (sumStability / cardsWithStability).toFixed(1) : 'N/A';

        return { heatmapValues, retentionRate, leechCards, matureCards, estimatedReviewTimeMin, avgStability };
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
                <div className="statspage-style-1" >
                    <p className="statspage-style-2" >{payload[0].name || payload[0].payload.day}</p>
                    <p className="statspage-style-3" style={{
  color: payload[0].color || 'var(--color-drug)'
}}>{payload[0].value} cartes</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="stats-page">
            <header className="stats-header app-drag-region">
                <div className="stats-title-wrap app-no-drag">
                    <div className="stats-title-icon">
                        <ChartBar size={18} weight="duotone" />
                    </div>
                    <div>
                        <h1>Statistiques & Progression</h1>
                        <p>Suivez l'efficacité de vos révisions FSRS</p>
                    </div>
                </div>
            </header>

            {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4 statspage-style-4" >
                    <div className="w-24 h-24 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <ChartBar size={48} weight="duotone" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Statistiques à venir</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg mx-auto">
                        Commencez à réviser pour voir vos statistiques. Vos progrès FSRS s'afficheront ici.
                    </p>
                </div>
            ) : (
                <div className="stats-content scroll-area">
                <section className="stats-kpi-grid">
                    <article className="stats-kpi-card color-accent-1">
                        <div className="stats-kpi-label"><BookOpen size={16} /> Total fiches</div>
                        <div className="stats-kpi-value">{cards.length}</div>
                    </article>
                    <article className="stats-kpi-card color-accent-2">
                        <div className="stats-kpi-label"><Brain size={16} /> Apprentissage</div>
                        <div className="stats-kpi-value">{learningCards.length}</div>
                    </article>
                    <article className="stats-kpi-card highlight">
                        <div className="stats-kpi-label"><ClockCounterClockwise size={16} /> À revoir</div>
                        <div className="stats-kpi-value">{dueCards.length}</div>
                    </article>
                    <article className="stats-kpi-card color-accent-3">
                        <div className="stats-kpi-label"><Timer size={16} /> Temps estimé</div>
                        <div className="stats-kpi-value">{estimatedReviewTimeMin > 0 ? `${estimatedReviewTimeMin} min` : 'Terminé'}</div>
                    </article>
                    
                    <article className="stats-kpi-card color-accent-4">
                        <div className="stats-kpi-label"><ChartBar size={16} /> Rétention</div>
                        <div className="stats-kpi-value">{asPercent(retentionRate)}</div>
                    </article>
                    <article className="stats-kpi-card color-accent-5">
                        <div className="stats-kpi-label"><CheckCircle size={16} /> Fiches matures</div>
                        <div className="stats-kpi-value">{matureCards}</div>
                    </article>
                    <article className="stats-kpi-card warning">
                        <div className="stats-kpi-label"><X size={16} /> Cartes critiques</div>
                        <div className="stats-kpi-value">{leechCards}</div>
                    </article>
                    <article className="stats-kpi-card color-accent-6">
                        <div className="stats-kpi-label"><Lightning size={16} /> Stabilité moy.</div>
                        <div className="stats-kpi-value">{avgStability} j</div>
                    </article>
                </section>

                <section className="stats-grid">
                    <article className="stats-panel glass-panel statspage-style-5" >
                        <h3>Prévisions de révision (7 jours)</h3>
                        <div className="statspage-style-6" >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} allowDecimals={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="stats-panel glass-panel statspage-style-7" >
                        <h3>Répartition par type</h3>
                        <div className="statspage-style-8" >
                            <div className="statspage-style-9" >
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                    <Pie
                                        data={byType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="80%"
                                        paddingAngle={6}
                                        cornerRadius={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {byType.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="statspage-style-10"  />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            </div>
                            <div className="pie-legend">
                                {byType.map((entry, index) => (
                                    <div key={entry.name} className="legend-item">
                                        <span className="legend-color" style={{ background: COLORS[index % COLORS.length] }} />
                                        <span className="legend-label">{entry.name}</span>
                                        <span className="legend-value">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>
                </section>

                <section className="stats-grid statspage-style-11" >
                    <article className="stats-panel glass-panel">
                        <h3>Activité (6 derniers mois)</h3>
                        <div className="home-heatmap-wrap">
                            <CalendarHeatmap
                                startDate={startDate}
                                endDate={new Date()}
                                values={heatmapValues}
                                classForValue={(value) => {
                                    if (!value) return 'color-empty';
                                    const count = hasHeatmapCount(value) ? value.count || 0 : 0;
                                    return `color-scale-${Math.min(count, 4)}`;
                                }}
                            />
                        </div>
                    </article>
                    
                    <article className="stats-panel glass-panel stats-progress-panel">
                        <h3>Progression d'apprentissage</h3>
                        <div className="statspage-style-12" >
                            <div className="stats-progress-row">
                                <span className="statspage-style-13" >Fiches découvertes</span>
                                <strong className="statspage-style-14" >{asPercent(reviewedRatio)}</strong>
                            </div>
                            <div className="stats-progress-track statspage-style-15" >
                                <div className="stats-progress-fill statspage-style-16" style={{
  width: asPercent(reviewedRatio)
}} />
                            </div>
                            <div className="statspage-style-17" >
                                <span className="statspage-style-18" >0%</span>
                                <span className="statspage-style-19" >100%</span>
                            </div>
                        </div>
                    </article>
                    
                    <LeechHunter cards={cards} onNavigate={(id) => navigate(`/browse?searchQuery=${encodeURIComponent(id)}`)} />
                </section>
                </div>
            )}
        </div>
    );
};

