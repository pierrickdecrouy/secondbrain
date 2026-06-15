import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { BookOpen, Brain, ChartBar, ClockCounterClockwise, Lightning, X, Timer, CheckCircle } from '@phosphor-icons/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { useCards } from '../context/CardContext';

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue =>
    typeof value === 'object' && value !== null && 'count' in value;

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

const COLORS = ['#4fb286', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export const StatsPage: React.FC = () => {
    const { cards } = useCards();
    const now = Date.now();

    const heatmapDataMap = new Map<string, number>();
    cards.forEach((card) => {
        const createDay = card.createdAt ? new Date(card.createdAt).toISOString().split('T')[0] : null;
        if (createDay) {
            heatmapDataMap.set(createDay, (heatmapDataMap.get(createDay) || 0) + 1);
        }

        if (!card.progress?.history?.length && card.updatedAt) {
            const updateDay = new Date(card.updatedAt).toISOString().split('T')[0];
            if (updateDay !== createDay) {
                heatmapDataMap.set(updateDay, (heatmapDataMap.get(updateDay) || 0) + 1);
            }
        }

        if (card.progress?.history) {
            card.progress.history.forEach(reviewDateIso => {
                const day = new Date(reviewDateIso).toISOString().split('T')[0];
                heatmapDataMap.set(day, (heatmapDataMap.get(day) || 0) + 1);
            });
        }
    });

    const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));
    const dueCards = cards.filter((c) =>
        (c.progress?.status === 'review' || c.progress?.status === 'learning' || c.progress?.status === 'relearning') &&
        c.progress.dueDate &&
        new Date(c.progress.dueDate).getTime() <= now
    );
    const learningCards = cards.filter((c) => c.progress?.status === 'learning' || c.progress?.status === 'relearning');
    const newCards = cards.filter((c) => !c.progress || c.progress.status === 'new');
    const totalReviewsDone = cards.reduce((acc, c) => acc + (c.progress?.reps ?? 0), 0);

    const totalLapses = cards.reduce((acc, c) => acc + (c.progress?.lapses ?? 0), 0);
    const retentionRate = totalReviewsDone > 0 ? ((totalReviewsDone - totalLapses) / totalReviewsDone) : 0;

    const leechCards = cards.filter(c => c.progress?.isLeech || c.progress?.status === 'suspended').length;
    
    const matureCards = cards.filter(c => (c.progress?.interval || 0) >= 21).length;
    
    const estimatedReviewTimeMin = Math.ceil((dueCards.length * 15) / 60);
    
    let sumStability = 0;
    let cardsWithStability = 0;
    cards.forEach(c => {
        if (c.progress?.stability) {
            sumStability += c.progress.stability;
            cardsWithStability++;
        }
    });
    const avgStability = cardsWithStability > 0 ? (sumStability / cardsWithStability).toFixed(1) : 'N/A';

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
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 12px', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{payload[0].name || payload[0].payload.day}</p>
                    <p style={{ margin: 0, color: payload[0].color || 'var(--color-drug)' }}>{payload[0].value} cartes</p>
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
                    <article className="stats-panel glass-panel" style={{ paddingBottom: '2rem' }}>
                        <h3>Prévisions de révision (7 jours)</h3>
                        <div style={{ flex: 1, minHeight: 0, width: '100%', marginTop: '1rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg)' }} />
                                    <Bar dataKey="count" fill="var(--color-drug)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="stats-panel glass-panel" style={{ paddingBottom: '2rem' }}>
                        <h3>Répartition par type</h3>
                        <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }} />
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

                <section className="stats-grid" style={{ marginTop: '0.5rem' }}>
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
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div className="stats-progress-row">
                                <span style={{ color: 'var(--color-text-muted)' }}>Fiches découvertes</span>
                                <strong style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>{asPercent(reviewedRatio)}</strong>
                            </div>
                            <div className="stats-progress-track" style={{ height: '12px', background: 'var(--color-bg)', borderRadius: '12px', overflow: 'hidden' }}>
                                <div className="stats-progress-fill" style={{ width: asPercent(reviewedRatio), background: 'linear-gradient(90deg, var(--color-drug), #3b82f6)', height: '100%', borderRadius: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>0%</span>
                                <span style={{ color: 'var(--color-text-muted)' }}>100%</span>
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
};

