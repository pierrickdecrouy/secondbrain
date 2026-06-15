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
        <div className="settings-tab-content">
            <div style={{ marginBottom: '30px' }}>
                <h2 className="settings-section-title">Intelligence des liens</h2>
                <p className="settings-section-desc">Tableau de bord de qualité de l'algorithme d'apprentissage automatique.</p>
            </div>

            {/* Learning Score Gauge */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '30px',
                color: 'white',
                textAlign: 'center',
                marginBottom: '24px'
            }}>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>
                    {dashStats.learningScore}<span style={{ fontSize: '1.2rem', opacity: 0.8 }}>/100</span>
                </div>
                <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px' }}>Score d'apprentissage</div>
                <div style={{
                    marginTop: '16px',
                    height: '8px',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${dashStats.learningScore}%`,
                        background: 'var(--color-surface)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                    }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Liens générés', value: dashStats.totalLinksGenerated, color: 'var(--color-physio)' },
                    { label: 'Supprimés', value: dashStats.totalSuppressed, color: 'var(--color-danger)' },
                    { label: 'Manuels', value: dashStats.totalManual, color: 'var(--color-success, #22c55e)' },
                    { label: 'Taux acceptation', value: `${dashStats.acceptanceRate}%`, color: 'var(--color-info, #8b5cf6)' }
                ].map(stat => (
                    <div key={stat.label} className="settings-card" style={{
                        padding: '16px',
                        textAlign: 'center',
                        marginBottom: '0'
                    }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Patterns & Vetoes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="settings-card" style={{ marginBottom: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Brain className="text-purple-500" size={16} /> Patterns appris</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Positifs (boosts)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-success, #22c55e)' }}>{dashStats.positivePatternCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Négatifs (pénalités)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{dashStats.negativePatternCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Vetoes (hard)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{dashStats.vetoCount}</span>
                    </div>
                </div>

                {/* Type Pair Scores */}
                <div className="settings-card" style={{ marginBottom: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lightning className="text-amber-500" size={16} /> Scores type-pair appris</h3>
                    {Object.entries(dashStats.typePairScores).length === 0 ? (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Pas encore de données</div>
                    ) : (
                        Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                            <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{pair.replace('|', ' ↔ ')}</span>
                                <span style={{
                                    fontWeight: 600,
                                    color: score > 0 ? 'var(--color-success, #22c55e)' : score < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                    fontSize: '0.85rem'
                                }}>
                                    {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Toxic Keywords */}
            {dashStats.topToxicKeywords.length > 0 && (
                <div className="settings-card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldWarning className="text-red-500" size={16} /> Mots-clés toxiques</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                        Ces mots génèrent souvent des faux positifs. L'algo les pénalise automatiquement.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {dashStats.topToxicKeywords.map(tw => (
                            <span key={tw.word} style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                background: tw.count >= 3 ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg)',
                                color: tw.count >= 3 ? 'var(--color-danger)' : 'var(--color-warning)',
                                border: `1px solid ${tw.count >= 3 ? 'var(--color-danger, #ef4444)' : 'var(--color-warning)'}`
                            }}>
                                {tw.word} <span style={{ opacity: 0.7 }}>×{tw.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Reset Button */}
            <div className="settings-card" style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--color-danger, #ef4444)' }}>
                        <Trash size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Réinitialiser l'intelligence</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Supprime tous les patterns appris, vetoes et mots toxiques.</div>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Réinitialiser toute l\'intelligence apprise ? L\'algo repartira de zéro.')) {
                                resetFeedback();
                                setDashStats(getDashboardStats());
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid var(--color-danger, #ef4444)',
                            color: 'var(--color-danger, #ef4444)',
                            fontWeight: 600,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-danger, #ef4444)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-danger, #ef4444)'; }}
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};
