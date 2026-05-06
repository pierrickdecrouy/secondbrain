
import React, { useMemo } from 'react';
import { Brain, AlertCircle, Clock } from 'lucide-react';
import type { Card } from '../types';
import { calculateQualityScore } from '../algorithms/qualityScoring';

interface KnowledgeHealthWidgetProps {
    cards: Card[];
    onReviewLowQuality: () => void;
}

/** A card with a computed weakness score for proactive review suggestions */
interface WeakNode {
    id: string;
    title: string;
    /** "quality" – low quality score | "srs" – poor SRS metrics */
    reason: 'quality' | 'srs';
    detail: string;
}

/** Compute how "weak" an SRS card is. Returns a score in [0,1] (higher = weaker). */
function srsWeaknessScore(card: Card): number {
    const p = card.progress;
    if (!p || p.status === 'new') return 0;

    let score = 0;

    // Low ease factor → card is hard to remember
    if (p.easeFactor <= 1.5) score += 0.4;
    else if (p.easeFactor <= 1.8) score += 0.25;
    else if (p.easeFactor <= 2.1) score += 0.1;

    // High lapse count
    if (p.lapses >= 5) score += 0.3;
    else if (p.lapses >= 3) score += 0.15;

    // Overdue by more than 7 days
    if (p.dueDate) {
        const overdueMs = Date.now() - new Date(p.dueDate).getTime();
        const overdueDays = overdueMs / (1000 * 60 * 60 * 24);
        if (overdueDays > 14) score += 0.3;
        else if (overdueDays > 7) score += 0.15;
    }

    // Suspended / leech
    if (p.status === 'suspended') score += 0.5;

    return Math.min(1, score);
}

export const KnowledgeHealthWidget: React.FC<KnowledgeHealthWidgetProps> = ({ cards, onReviewLowQuality }) => {

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
            // Using a dummy connectivity count of 3 as an average if unavailable, 
            // since we don't have full graph access here without heavy computation.
            // For dashboard purposes, the content score dominates.
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

    // Proactive weak node detection (SRS-based)
    const topWeakNodes = useMemo((): WeakNode[] => {
        const nodes: (WeakNode & { score: number })[] = [];

        cards.forEach(card => {
            const score = srsWeaknessScore(card);
            if (score < 0.25) return; // Below threshold

            const p = card.progress;
            if (!p) return; // Safety guard (srsWeaknessScore already returns 0 without progress)

            let detail = '';
            if (p.status === 'suspended') {
                detail = 'Carte suspendue (leech)';
            } else if (p.easeFactor <= 1.5) {
                detail = `Facilité très basse (${p.easeFactor.toFixed(2)})`;
            } else if (p.lapses >= 3) {
                detail = `${p.lapses} échecs accumulés`;
            } else {
                const overdueDays = p.dueDate
                    ? Math.floor((Date.now() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                detail = overdueDays > 0 ? `En retard de ${overdueDays}j` : 'Révision difficile';
            }

            nodes.push({ id: card.id, title: card.title, reason: 'srs', detail, score });
        });

        // Return top 3 weakest cards
        return nodes
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(({ score: _score, ...rest }) => rest);
    }, [cards]);

    // Compute widths for bars
    const getWidth = (count: number) => {
        if (stats.total === 0) return '0%';
        return `${Math.max(2, (count / stats.total) * 100)}%`;
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

            {/* Proactive weak-node suggestions (SRS-based) */}
            {topWeakNodes.length > 0 && (
                <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f9',
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Clock size={13} />
                        Nœuds à réviser en priorité
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {topWeakNodes.map(node => (
                            <div key={node.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#fff7ed',
                                border: '1px solid #ffedd5',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {node.title}
                                </span>
                                <span style={{ color: '#c2410c', marginLeft: '8px', flexShrink: 0, fontSize: '0.78rem' }}>
                                    {node.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer / Actions */}
            {stats.weakCount > 0 && (
                <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: topWeakNodes.length > 0 ? 'none' : '1px solid #f1f5f9',
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

            {stats.weakCount === 0 && stats.total > 0 && topWeakNodes.length === 0 && (
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
