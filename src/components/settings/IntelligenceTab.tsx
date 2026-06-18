import React, { useState, useEffect } from 'react';
import { Brain, Lightning, ShieldWarning, Trash } from '@phosphor-icons/react';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../../linkFeedback';

export const IntelligenceTab: React.FC = () => {
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        setDashStats(getDashboardStats());
    }, []);

    if (!dashStats) return null;

    return (
        <div className="flex-1 p-5 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)]">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Intelligence des liens</h2>
                <p className="text-[var(--color-text-muted)]">Tableau de bord de qualité de l'algorithme d'apprentissage automatique.</p>
            </div>

            {/* Learning Score Gauge */}
            <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[20px] p-8 text-white text-center mb-6">
                <div className="text-[3rem] font-extrabold">
                    {dashStats.learningScore}<span className="text-[1.2rem] opacity-80">/100</span>
                </div>
                <div className="text-[0.95rem] opacity-90 mt-1">Score d'apprentissage</div>
                <div className="mt-4 h-2 bg-white/25 rounded bg-clip-padding overflow-hidden">
                    <div style={{ width: `${dashStats.learningScore}%` }} className="h-full bg-[var(--color-surface)] rounded transition-all duration-500 ease-in-out" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Liens générés', value: dashStats.totalLinksGenerated, color: 'text-[var(--color-physio)]' },
                    { label: 'Supprimés', value: dashStats.totalSuppressed, color: 'text-[var(--color-danger)]' },
                    { label: 'Manuels', value: dashStats.totalManual, color: 'text-[#22c55e]' },
                    { label: 'Taux acceptation', value: `${dashStats.acceptanceRate}%`, color: 'text-[#8b5cf6]' }
                ].map(stat => (
                    <div key={stat.label} className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-center">
                        <div className={`text-[1.6rem] font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Patterns & Vetoes */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <h3 className="text-[0.95rem] font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2"><Brain className="text-purple-500" size={16} /> Patterns appris</h3>
                    <div className="flex justify-between mb-2">
                        <span className="text-[var(--color-text-muted)] text-[0.85rem]">Positifs (boosts)</span>
                        <span className="font-semibold text-[#22c55e]">{dashStats.positivePatternCount}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-[var(--color-text-muted)] text-[0.85rem]">Négatifs (pénalités)</span>
                        <span className="font-semibold text-[var(--color-danger)]">{dashStats.negativePatternCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)] text-[0.85rem]">Vetoes (hard)</span>
                        <span className="font-semibold text-[var(--color-warning)]">{dashStats.vetoCount}</span>
                    </div>
                </div>

                {/* Type Pair Scores */}
                <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <h3 className="text-[0.95rem] font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2"><Lightning className="text-amber-500" size={16} /> Scores type-pair appris</h3>
                    {Object.entries(dashStats.typePairScores).length === 0 ? (
                        <div className="text-[var(--color-text-muted)] text-[0.85rem] italic">Pas encore de données</div>
                    ) : (
                        Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                            <div key={pair} className="flex justify-between mb-1.5">
                                <span className="text-[var(--color-text-muted)] text-[0.85rem]">{pair.replace('|', ' ↔ ')}</span>
                                <span className={`font-semibold text-[0.85rem] ${score > 0 ? 'text-[#22c55e]' : score < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>
                                    {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Toxic Keywords */}
            {dashStats.topToxicKeywords.length > 0 && (
                <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6">
                    <h3 className="text-[0.95rem] font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2"><ShieldWarning className="text-red-500" size={16} /> Mots-clés toxiques</h3>
                    <p className="text-[var(--color-text-muted)] text-[0.8rem] mb-3">
                        Ces mots génèrent souvent des faux positifs. L'algo les pénalise automatiquement.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {dashStats.topToxicKeywords.map(tw => (
                            <span key={tw.word} className={`py-1 px-3 rounded-full text-[0.8rem] font-medium border ${tw.count >= 3 ? 'bg-red-500/10 text-[var(--color-danger)] border-[var(--color-danger,#ef4444)]' : 'bg-[var(--color-bg)] text-[var(--color-warning)] border-[var(--color-warning)]'}`}>
                                {tw.word} <span className="opacity-70">×{tw.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Reset Button */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-danger,#ef4444)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 rounded-xl text-[var(--color-danger,#ef4444)]">
                        <Trash size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-[var(--color-text)] mb-1">Réinitialiser l'intelligence</div>
                        <div className="text-[0.8rem] text-[var(--color-text-muted)]">Supprime tous les patterns appris, vetoes et mots toxiques.</div>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Réinitialiser toute l\'intelligence apprise ? L\'algo repartira de zéro.')) {
                                resetFeedback();
                                setDashStats(getDashboardStats());
                            }
                        }}
                        className="py-2 px-4 bg-transparent border border-[var(--color-danger,#ef4444)] text-[var(--color-danger,#ef4444)] font-semibold rounded-xl cursor-pointer text-[0.85rem] transition-all duration-200 hover:bg-[var(--color-danger,#ef4444)] hover:text-white"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};
