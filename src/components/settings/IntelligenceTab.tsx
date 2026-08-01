import React, { useState, useEffect } from 'react';
import { Brain, Lightning, ShieldWarning, Trash } from '@phosphor-icons/react';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../../linkFeedback';
import { SettingsCard, CardSection, CardBody, StatCard, DangerButton } from './SettingsUI';

export const IntelligenceTab: React.FC = () => {
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        setDashStats(getDashboardStats());
    }, []);

    if (!dashStats) return null;

    const score = dashStats.learningScore;
    const scoreColorHex = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const scoreColorClass = score >= 75 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="flex flex-col gap-6">
            {/* Score card */}
            <SettingsCard>
                <CardBody className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Circle gauge */}
                    <div className="relative flex items-center justify-center shrink-0">
                        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="transform -rotate-90">
                            <circle cx="44" cy="44" r="36" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" fill="none" />
                            <circle
                                cx="44" cy="44" r="36"
                                stroke={scoreColorHex}
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out" 
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-black tracking-tight leading-none ${scoreColorClass}`}>{score}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">/100</span>
                        </div>
                    </div>
                    <div className="text-center sm:text-left">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Score d'apprentissage</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                            Évaluation de la qualité de l'algorithme de liens sémantiques basée sur vos retours.
                        </div>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Liens générés" value={dashStats.totalLinksGenerated} color="#a855f7" />
                <StatCard label="Supprimés" value={dashStats.totalSuppressed} color="#ef4444" />
                <StatCard label="Manuels" value={dashStats.totalManual} color="#10b981" />
                <StatCard label="Taux d'acceptation" value={`${dashStats.acceptanceRate}%`} color="#8b5cf6" />
            </div>

            {/* Patterns + type-pair */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard>
                    <CardSection title="Patterns appris" icon={<Brain size={18} weight="duotone" />} />
                    <CardBody className="flex flex-col">
                        {[
                            { label: 'Positifs (boosts)', value: dashStats.positivePatternCount, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                            { label: 'Négatifs (pénalités)', value: dashStats.negativePatternCount, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
                            { label: 'Vetos (hard)', value: dashStats.vetoCount, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                        ].map((row, i, arr) => (
                            <div key={row.label} className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{row.label}</span>
                                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-md ${row.bg} ${row.color}`}>{row.value}</span>
                            </div>
                        ))}
                    </CardBody>
                </SettingsCard>

                <SettingsCard>
                    <CardSection title="Scores type-pair" icon={<Lightning size={18} weight="duotone" />} />
                    <CardBody>
                        {Object.entries(dashStats.typePairScores).length === 0 ? (
                            <div className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                                Aucune donnée enregistrée pour l'instant.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {Object.entries(dashStats.typePairScores).map(([pair, s]) => (
                                    <div key={pair} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">{pair.replace('|', ' ↔ ')}</span>
                                        <span className={`font-bold ${s > 0 ? 'text-emerald-500' : s < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {s > 0 ? '+' : ''}{(s * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </SettingsCard>
            </div>

            {/* Toxic keywords */}
            {dashStats.topToxicKeywords.length > 0 && (
                <SettingsCard>
                    <CardSection title="Mots-clés toxiques" subtitle="Ces termes génèrent souvent des faux positifs et sont automatiquement pénalisés." icon={<ShieldWarning size={18} weight="duotone" />} />
                    <CardBody>
                        <div className="flex flex-wrap gap-2.5">
                            {dashStats.topToxicKeywords.map(tw => {
                                const isHigh = tw.count >= 3;
                                return (
                                    <span key={tw.word} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                        isHigh ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' 
                                               : 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        {tw.word} <span className="opacity-70 font-mono tracking-normal">×{tw.count}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </CardBody>
                </SettingsCard>
            )}

            {/* Reset */}
            <SettingsCard danger>
                <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                            <Trash size={24} weight="duotone" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Réinitialiser l'intelligence</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                                Supprime tous les patterns, vetos et mots toxiques appris. L'algorithme repartira de zéro.
                            </div>
                        </div>
                    </div>
                    <DangerButton onClick={() => {
                        if (confirm("Réinitialiser toute l'intelligence apprise ?")) {
                            resetFeedback();
                            setDashStats(getDashboardStats());
                        }
                    }} className="w-full sm:w-auto">
                        Réinitialiser
                    </DangerButton>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
