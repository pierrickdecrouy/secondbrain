import React, { useState, useEffect } from 'react';
import { Brain, Lightning, ShieldWarning, Trash } from '@phosphor-icons/react';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../../linkFeedback';

export const IntelligenceTab: React.FC = () => {
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        setDashStats(getDashboardStats());
    }, []);

    if (!dashStats) return null;

    const cardStyle = {
        backgroundColor: '#0f1420',
        borderRadius: 16,
        border: '1px solid #1e293b',
        padding: 24,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px 0' }}>Intelligence</h2>
                <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Tableau de bord de qualité de l'algorithme d'apprentissage automatique.</p>
            </div>

            {/* Learning Score Gauge */}
            <div style={{
                background: 'linear-gradient(to bottom right, #667eea, #764ba2)',
                borderRadius: 20, padding: 32, textAlign: 'center', color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ fontSize: 48, fontWeight: 800 }}>
                    {dashStats.learningScore}<span style={{ fontSize: 20, opacity: 0.8 }}>/100</span>
                </div>
                <div style={{ fontSize: 15, opacity: 0.9, marginTop: 4 }}>Score d'apprentissage</div>
                <div style={{ marginTop: 16, height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${dashStats.learningScore}%`, height: '100%', backgroundColor: '#0f1420', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { label: 'Liens générés', value: dashStats.totalLinksGenerated, color: '#a855f7' },
                    { label: 'Supprimés', value: dashStats.totalSuppressed, color: '#ef4444' },
                    { label: 'Manuels', value: dashStats.totalManual, color: '#22c55e' },
                    { label: 'Taux acceptation', value: `${dashStats.acceptanceRate}%`, color: '#8b5cf6' }
                ].map(stat => (
                    <div key={stat.label} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Patterns & Vetoes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={cardStyle}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Brain color="#a855f7" size={16} /> Patterns appris
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: '#94a3b8', fontSize: 14 }}>Positifs (boosts)</span>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{dashStats.positivePatternCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: '#94a3b8', fontSize: 14 }}>Négatifs (pénalités)</span>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{dashStats.negativePatternCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8', fontSize: 14 }}>Vetoes (hard)</span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{dashStats.vetoCount}</span>
                    </div>
                </div>

                {/* Type Pair Scores */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lightning color="#f59e0b" size={16} /> Scores type-pair appris
                    </h3>
                    {Object.entries(dashStats.typePairScores).length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>Pas encore de données</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                                <div key={pair} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>{pair.replace('|', ' ↔ ')}</span>
                                    <span style={{ 
                                        fontWeight: 600, fontSize: 14, 
                                        color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : '#94a3b8' 
                                    }}>
                                        {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Toxic Keywords */}
            {dashStats.topToxicKeywords.length > 0 && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldWarning color="#ef4444" size={16} /> Mots-clés toxiques
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px 0' }}>
                        Ces mots génèrent souvent des faux positifs. L'algo les pénalise automatiquement.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {dashStats.topToxicKeywords.map(tw => (
                            <span key={tw.word} style={{
                                padding: '4px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500,
                                border: tw.count >= 3 ? '1px solid #ef4444' : '1px solid #f59e0b',
                                backgroundColor: tw.count >= 3 ? 'rgba(239, 68, 68, 0.1)' : '#0b0f17',
                                color: tw.count >= 3 ? '#ef4444' : '#f59e0b',
                                display: 'flex', alignItems: 'center', gap: 4
                            }}>
                                {tw.word} <span style={{ opacity: 0.7 }}>×{tw.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Reset Button */}
            <div style={{ ...cardStyle, border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: '#0f1420' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, color: '#ef4444', display: 'flex' }}>
                        <Trash size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Réinitialiser l'intelligence</div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>Supprime tous les patterns appris, vetoes et mots toxiques.</div>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Réinitialiser toute l\'intelligence apprise ? L\'algo repartira de zéro.')) {
                                resetFeedback();
                                setDashStats(getDashboardStats());
                            }
                        }}
                        style={{
                            padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #ef4444',
                            color: '#ef4444', fontWeight: 600, borderRadius: 12, cursor: 'pointer', fontSize: 14
                        }}
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};
