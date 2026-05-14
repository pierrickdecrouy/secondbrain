import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { BookOpen, Brain, ChartBar, ClockCounterClockwise, Lightning, X } from '@phosphor-icons/react';
import type { Card } from '../types';

interface StatsPageProps {
    cards: Card[];
    onClose: () => void;
}

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue =>
    typeof value === 'object' && value !== null && 'count' in value;

const asPercent = (value: number) => `${Math.round(value * 100)}%`;

export const StatsPage: React.FC<StatsPageProps> = ({ cards, onClose }) => {
    const now = Date.now();

    const heatmapDataMap = new Map<string, number>();
    cards.forEach((card) => {
        if (!card.updatedAt) return;
        const day = new Date(card.updatedAt).toISOString().split('T')[0];
        heatmapDataMap.set(day, (heatmapDataMap.get(day) || 0) + 1);
    });

    const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));
    const dueCards = cards.filter((c) =>
        c.progress?.status === 'review' &&
        c.progress.dueDate &&
        new Date(c.progress.dueDate).getTime() <= now
    );
    const learningCards = cards.filter((c) => c.progress?.status === 'learning');
    const newCards = cards.filter((c) => !c.progress || c.progress.status === 'new');
    const totalReviewsDone = cards.reduce((acc, c) => {
        const progress = c.progress as (typeof c.progress & { reviewCount?: number }) | undefined;
        return acc + (progress?.reps ?? progress?.reviewCount ?? 0);
    }, 0);

    const byType = Array.from(new Set(cards.map((card) => card.type))).sort().map((type) => ({
        type,
        count: cards.filter((card) => card.type === type).length
    }));

    const reviewedRatio = cards.length > 0 ? (cards.length - newCards.length) / cards.length : 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    return (
        <div className="stats-page">
            <header className="stats-header app-drag-region">
                <div className="stats-title-wrap app-no-drag">
                    <div className="stats-title-icon">
                        <ChartBar size={18} weight="duotone" />
                    </div>
                    <div>
                        <h1>Statistiques</h1>
                        <p>Vision synthétique de votre progression et de l’activité de vos cartes.</p>
                    </div>
                </div>
                <button className="stats-close-btn app-no-drag" onClick={onClose}>
                    <X size={16} />
                    Retour
                </button>
            </header>

            <div className="stats-content">
                <section className="stats-kpi-grid">
                    <article className="stats-kpi-card">
                        <div className="stats-kpi-label"><BookOpen size={14} /> Total fiches</div>
                        <div className="stats-kpi-value">{cards.length}</div>
                    </article>
                    <article className="stats-kpi-card">
                        <div className="stats-kpi-label"><ClockCounterClockwise size={14} /> À revoir</div>
                        <div className="stats-kpi-value">{dueCards.length}</div>
                    </article>
                    <article className="stats-kpi-card">
                        <div className="stats-kpi-label"><Brain size={14} /> En apprentissage</div>
                        <div className="stats-kpi-value">{learningCards.length}</div>
                    </article>
                    <article className="stats-kpi-card">
                        <div className="stats-kpi-label"><Lightning size={14} /> Révisions effectuées</div>
                        <div className="stats-kpi-value">{totalReviewsDone}</div>
                    </article>
                </section>

                <section className="stats-grid">
                    <article className="stats-panel">
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

                    <article className="stats-panel">
                        <h3>Répartition des types</h3>
                        <ul className="stats-type-list">
                            {byType.map((entry) => (
                                <li key={entry.type}>
                                    <span>{entry.type}</span>
                                    <strong>{entry.count}</strong>
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="stats-panel stats-progress-panel">
                    <h3>Progression globale</h3>
                    <div className="stats-progress-row">
                        <span>Fiches déjà étudiées</span>
                        <strong>{asPercent(reviewedRatio)}</strong>
                    </div>
                    <div className="stats-progress-track">
                        <div className="stats-progress-fill" style={{ width: asPercent(reviewedRatio) }} />
                    </div>
                </section>
            </div>
        </div>
    );
};
