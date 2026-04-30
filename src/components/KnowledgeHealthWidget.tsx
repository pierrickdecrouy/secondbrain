
import React, { useMemo } from 'react';
import { Brain, AlertCircle, Network } from 'lucide-react';
import type { Card, Node, Link } from '../types';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { detectWeakNodes } from '../algorithms/graphAlgorithms';

interface KnowledgeHealthWidgetProps {
    cards: Card[];
    onReviewLowQuality: () => void;
    graphNodes?: Node[];
    graphLinks?: Link[];
    onReviewCard?: (cardId: string) => void;
}

export const KnowledgeHealthWidget: React.FC<KnowledgeHealthWidgetProps> = ({
    cards,
    onReviewLowQuality,
    graphNodes = [],
    graphLinks = [],
    onReviewCard,
}) => {

    // Calculate stats
    const stats = useMemo(() => {
        const counts = {
            excellence: 0,
            robuste: 0,
            correct: 0,
            incomplet: 0,
            ebauche: 0
        };

        let weakCount = 0; // Incomplet + Ebauche

        cards.forEach(card => {
            const result = calculateQualityScore(card, card.manualConnections?.length || 0);

            switch (result.label) {
                case 'Excellence': counts.excellence++; break;
                case 'Robuste': counts.robuste++; break;
                case 'Correct': counts.correct++; break;
                case 'Incomplet': counts.incomplet++; weakCount++; break;
                case 'Ébauche': counts.ebauche++; weakCount++; break;
            }
        });

        return { counts, weakCount, total: cards.length };
    }, [cards]);

    // Build quality map for all cards (used by detectWeakNodes)
    const qualityMap = useMemo(() => {
        const map = new Map<string, { score: number; label: string }>();
        cards.forEach(card => {
            const result = calculateQualityScore(card, card.manualConnections?.length || 0);
            map.set(card.id, { score: result.score, label: result.label });
        });
        return map;
    }, [cards]);

    // Detect weak/isolated nodes from graph data
    const weakNodes = useMemo(() => {
        if (graphNodes.length === 0) return [];
        return detectWeakNodes(graphNodes, graphLinks, qualityMap, 3);
    }, [graphNodes, graphLinks, qualityMap]);

    // Compute widths for bars
    const getWidth = (count: number) => {
        if (stats.total === 0) return '0%';
        return `${Math.max(2, (count / stats.total) * 100)}%`;
    };

    const qualityLabelColors: Record<string, string> = {
        'Ébauche': '#94a3b8',
        'Incomplet': '#f97316',
        'Correct': '#3b82f6',
        'Robuste': '#10b981',
        'Excellence': '#f59e0b',
    };

    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            width: '100%',
            maxWidth: '480px',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <Brain size={24} color="#6366f1" />
                    Solidité des Connaissances
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: 600,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    padding: '4px 10px',
                    borderRadius: '20px'
                }}>
                    {stats.total} fiches
                </span>
            </div>

            {/* Stats Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Excellence */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: '#475569' }}>Excellence</div>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#f59e0b',
                            width: getWidth(stats.counts.excellence),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {stats.counts.excellence}
                    </div>
                </div>

                {/* Robuste */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: '#475569' }}>Robuste</div>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#10b981',
                            width: getWidth(stats.counts.robuste),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {stats.counts.robuste}
                    </div>
                </div>

                {/* Correct */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: '#475569' }}>Correct</div>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#3b82f6',
                            width: getWidth(stats.counts.correct),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {stats.counts.correct}
                    </div>
                </div>

                {/* Incomplet */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: '#475569' }}>Incomplet</div>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#f97316',
                            width: getWidth(stats.counts.incomplet),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {stats.counts.incomplet}
                    </div>
                </div>

                {/* Ebauche */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: '#475569' }}>Ébauche</div>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#94a3b8',
                            width: getWidth(stats.counts.ebauche),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                        {stats.counts.ebauche}
                    </div>
                </div>

            </div>

            {/* Proactive Graph Suggestions */}
            {weakNodes.length > 0 && (
                <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f9',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#475569',
                    }}>
                        <Network size={15} color="#6366f1" />
                        Nœuds à renforcer
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {weakNodes.map(node => (
                            <div
                                key={node.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    gap: '8px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {node.name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                                        {node.reason} · {node.connectionCount} lien{node.connectionCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: `${qualityLabelColors[node.qualityLabel] ?? '#94a3b8'}18`,
                                    color: qualityLabelColors[node.qualityLabel] ?? '#94a3b8',
                                    border: `1px solid ${qualityLabelColors[node.qualityLabel] ?? '#94a3b8'}40`,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {node.qualityLabel}
                                </span>
                                {onReviewCard && (
                                    <button
                                        onClick={() => onReviewCard(node.id)}
                                        title="Réviser cette fiche"
                                        style={{
                                            background: '#ede9fe',
                                            color: '#6d28d9',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Réviser
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer / Actions */}
            {stats.weakCount > 0 && (
                <div style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onReviewLowQuality}
                        style={{
                            backgroundColor: '#fff7ed',
                            color: '#c2410c',
                            border: '1px solid #ffedd5',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffedd5';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff7ed';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <AlertCircle size={16} />
                        Réviser les {stats.weakCount} fiches faibles
                    </button>
                </div>
            )}

            {stats.weakCount === 0 && stats.total > 0 && weakNodes.length === 0 && (
                <div style={{
                    marginTop: '28px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f9',
                    textAlign: 'center',
                    color: '#10b981',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }}>
                    ✨ Votre cerveau est en pleine forme !
                </div>
            )}
        </div>
    );
};
