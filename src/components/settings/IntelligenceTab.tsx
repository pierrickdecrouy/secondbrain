import React, { useState, useEffect } from 'react';
import { Brain, Lightning, ShieldWarning, Trash } from '@phosphor-icons/react';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../../linkFeedback';
import { S, SettingsCard, CardSection, CardBody, StatCard, DangerButton } from './SettingsUI';

export const IntelligenceTab: React.FC = () => {
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        setDashStats(getDashboardStats());
    }, []);

    if (!dashStats) return null;

    const score = dashStats.learningScore;
    const scoreColor = score >= 75 ? S.primary : score >= 40 ? S.warning : S.danger;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Score card */}
            <SettingsCard>
                <CardBody style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* Circle gauge */}
                    <div style={{ flexShrink: 0, position: 'relative', width: 88, height: 88 }}>
                        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="44" cy="44" r="36" stroke={S.border} strokeWidth="8" fill="none" />
                            <circle
                                cx="44" cy="44" r="36"
                                stroke={scoreColor}
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor }}>{score}</span>
                            <span style={{ fontSize: 9, color: S.muted, fontWeight: 600, textTransform: 'uppercase' }}>/100</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: S.text }}>Score d'apprentissage</div>
                        <div style={{ fontSize: 13, color: S.muted, marginTop: 4, lineHeight: 1.5 }}>
                            Évaluation de la qualité de l'algorithme de liens sémantiques basée sur vos retours.
                        </div>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <StatCard label="Liens générés" value={dashStats.totalLinksGenerated} color="#a855f7" />
                <StatCard label="Supprimés" value={dashStats.totalSuppressed} color={S.danger} />
                <StatCard label="Manuels" value={dashStats.totalManual} color={S.primary} />
                <StatCard label="Taux d'acceptation" value={`${dashStats.acceptanceRate}%`} color="#8b5cf6" />
            </div>

            {/* Patterns + type-pair */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SettingsCard>
                    <CardSection title="Patterns appris" icon={<Brain size={16} />} />
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {[
                            { label: 'Positifs (boosts)', value: dashStats.positivePatternCount, color: S.primary },
                            { label: 'Négatifs (pénalités)', value: dashStats.negativePatternCount, color: S.danger },
                            { label: 'Vetos (hard)', value: dashStats.vetoCount, color: S.warning },
                        ].map((row, i, arr) => (
                            <div key={row.label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : 'none',
                            }}>
                                <span style={{ fontSize: 13, color: S.muted }}>{row.label}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                            </div>
                        ))}
                    </CardBody>
                </SettingsCard>

                <SettingsCard>
                    <CardSection title="Scores type-pair" icon={<Lightning size={16} />} />
                    <CardBody>
                        {Object.entries(dashStats.typePairScores).length === 0 ? (
                            <div style={{ fontSize: 13, color: S.muted, fontStyle: 'italic', padding: '12px 0' }}>
                                Aucune donnée enregistrée pour l'instant.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                                    <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: S.muted }}>{pair.replace('|', ' ↔ ')}</span>
                                        <span style={{
                                            fontWeight: 700, fontSize: 13,
                                            color: score > 0 ? S.primary : score < 0 ? S.danger : S.muted,
                                        }}>
                                            {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
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
                    <CardSection title="Mots-clés toxiques" subtitle="Ces termes génèrent souvent des faux positifs et sont automatiquement pénalisés." icon={<ShieldWarning size={16} />} />
                    <CardBody>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {dashStats.topToxicKeywords.map(tw => (
                                <span key={tw.word} style={{
                                    padding: '4px 12px',
                                    borderRadius: 99,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    border: `1px solid ${tw.count >= 3 ? S.danger + '66' : S.warning + '66'}`,
                                    background: tw.count >= 3 ? S.dangerDim : S.warningDim,
                                    color: tw.count >= 3 ? S.danger : S.warning,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}>
                                    {tw.word} <span style={{ opacity: 0.65 }}>×{tw.count}</span>
                                </span>
                            ))}
                        </div>
                    </CardBody>
                </SettingsCard>
            )}

            {/* Reset */}
            <SettingsCard danger>
                <CardBody style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: S.dangerDim, color: S.danger,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Trash size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: S.text, marginBottom: 2 }}>Réinitialiser l'intelligence</div>
                        <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.5 }}>
                            Supprime tous les patterns, vetos et mots toxiques appris. L'algorithme repartira de zéro.
                        </div>
                    </div>
                    <DangerButton onClick={() => {
                        if (confirm("Réinitialiser toute l'intelligence apprise ?")) {
                            resetFeedback();
                            setDashStats(getDashboardStats());
                        }
                    }}>
                        Réinitialiser
                    </DangerButton>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
