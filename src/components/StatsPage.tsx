import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Lightning, BookOpen, Brain, Clock, Plus } from '@phosphor-icons/react';
import type { Card } from '../types';

interface StatsPageProps {
    cards: Card[];
    onClose: () => void;
}

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue => {
    return typeof value === 'object' && value !== null && 'count' in value;
};

export const StatsPage: React.FC<StatsPageProps> = ({ cards, onClose }) => {
    const heatmapDataMap = new Map<string, number>();
    cards.forEach(c => {
        if (c.updatedAt) {
            const dateStr = new Date(c.updatedAt).toISOString().split('T')[0];
            heatmapDataMap.set(dateStr, (heatmapDataMap.get(dateStr) || 0) + 1);
        }
    });
    const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const dueCards = cards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const learningCards = cards.filter(c => c.progress?.status === 'learning');
    const totalToReview = dueCards.length;
    const newCards = cards.filter(c => !c.progress || c.progress.status === 'new');

    const totalReviewsDone = cards.reduce((acc, c) => acc + (c.progress?.reviewCount || 0), 0);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)]/90 backdrop-blur z-10">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
                        <Lightning className="text-[var(--color-drug)]" weight="duotone" />
                        Statistiques
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Analyse de votre apprentissage</p>
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    Retour
                </button>
            </div>

            <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                            <BookOpen size={100} weight="duotone" />
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-wider z-10">
                            Total Fiches
                        </div>
                        <div className="text-4xl font-black text-[var(--color-text)] mt-2 z-10">{cards.length}</div>
                    </div>
                    
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-4 -bottom-4 text-[var(--color-patho)] opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                            <Clock size={100} weight="duotone" />
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-wider z-10">
                            À Réviser
                        </div>
                        <div className="text-4xl font-black text-[var(--color-text)] mt-2 z-10">{totalToReview}</div>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-4 -bottom-4 text-[var(--color-physio)] opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                            <Plus size={100} weight="duotone" />
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-wider z-10">
                            Nouvelles
                        </div>
                        <div className="text-4xl font-black text-[var(--color-text)] mt-2 z-10">{newCards.length}</div>
                    </div>

                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute -right-4 -bottom-4 text-[var(--color-data)] opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-300">
                            <Brain size={100} weight="duotone" />
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-wider z-10">
                            En Cours
                        </div>
                        <div className="text-4xl font-black text-[var(--color-text)] mt-2 z-10">{learningCards.length}</div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-[var(--color-drug)] to-[var(--color-physio)] rounded-2xl p-6 text-white shadow-lg flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300">
                        <Lightning size={120} weight="fill" />
                    </div>
                    <div className="text-white/80 text-sm font-bold uppercase tracking-wider z-10">Total des révisions effectuées</div>
                    <div className="text-5xl font-black z-10">{totalReviewsDone}</div>
                </div>

                {/* Heatmap */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
                        <Lightning className="text-[var(--color-data)]" />
                        Activité (6 derniers mois)
                    </h3>
                    <div className="home-heatmap-wrap" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                        <CalendarHeatmap
                            startDate={startDate}
                            endDate={endDate}
                            values={heatmapValues}
                            classForValue={(value) => {
                                if (!value) return 'color-empty';
                                const count = hasHeatmapCount(value) ? value.count || 0 : 0;
                                return 'color-scale-' + Math.min(count, 4);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
