
import React, { useMemo } from 'react';
import { Brain, WarningCircle, Clock } from '@phosphor-icons/react';
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
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
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
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <Brain size={24} color="var(--color-drug)" />
                    Solidité des Connaissances
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
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
                    <div style={{ width: '85px', fontWeight: 500, color: 'var(--color-text)' }}>Excellence</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--color-warning)',
                            width: getWidth(stats.counts.excellence),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                        {stats.counts.excellence}
                    </div>
                </div>

                {/* Robuste */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: 'var(--color-text)' }}>Robuste</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--color-success)',
                            width: getWidth(stats.counts.robuste),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                        {stats.counts.robuste}
                    </div>
                </div>

                {/* Correct */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: 'var(--color-text)' }}>Correct</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--color-physio)',
                            width: getWidth(stats.counts.correct),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                        {stats.counts.correct}
                    </div>
                </div>

                {/* Incomplet */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: 'var(--color-text)' }}>Incomplet</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: '#f97316', // Orange stays orange or uses warning
                            width: getWidth(stats.counts.incomplet),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                        {stats.counts.incomplet}
                    </div>
                </div>

                {/* Ebauche */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '85px', fontWeight: 500, color: 'var(--color-text)' }}>Ébauche</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', margin: '0 16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--color-text-muted)',
                            width: getWidth(stats.counts.ebauche),
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)' }}>
                        {stats.counts.ebauche}
                    </div>
                </div>

            </div>

            {/* Proactive weak-node suggestions (SRS-based) */}
            {topWeakNodes.length > 0 && (
                <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
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
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {node.title}
                                </span>
                                <span style={{ color: '#ef4444', marginLeft: '8px', flexShrink: 0, fontSize: '0.78rem' }}>
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
                    borderTop: topWeakNodes.length > 0 ? 'none' : '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onReviewLowQuality}
                        style={{
                            backgroundColor: 'var(--color-bg)',
                            color: '#ef4444',
                            border: '1px solid var(--color-border)',
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
                            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <WarningCircle size={16} />
                        Réviser les {stats.weakCount} fiches faibles
                    </button>
                </div>
            )}

            {stats.weakCount === 0 && stats.total > 0 && topWeakNodes.length === 0 && (
                <div style={{
                    marginTop: '28px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--color-border)',
                    textAlign: 'center',
                    color: 'var(--color-success)',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }}>
                    ✨ Votre cerveau est en pleine forme !
                </div>
            )}
        </div>
    );
};
