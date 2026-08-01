
import React, { useMemo } from 'react';
import { Brain, WarningCircle, Clock } from '@phosphor-icons/react';
import type { Card } from '../types';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import './styles/KnowledgeHealthWidget.css';

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
        <div className="knowledgehealthwidget-style-1" >
            {/* Header */}
            <div className="knowledgehealthwidget-style-2" >
                <div className="knowledgehealthwidget-style-3" >
                    <Brain size={24} color="var(--color-drug)" />
                    Solidité des Connaissances
                </div>
                <span className="knowledgehealthwidget-style-4" >
                    {stats.total} fiches
                </span>
            </div>

            {/* Stats Bars */}
            <div className="knowledgehealthwidget-style-5" >

                {/* Excellence */}
                <div className="knowledgehealthwidget-style-6" >
                    <div className="knowledgehealthwidget-style-7" >Excellence</div>
                    <div className="knowledgehealthwidget-style-8" >
                        <div className="knowledgehealthwidget-style-9" style={{
  width: getWidth(stats.counts.excellence)
}} />
                    </div>
                    <div className="knowledgehealthwidget-style-10" >
                        {stats.counts.excellence}
                    </div>
                </div>

                {/* Robuste */}
                <div className="knowledgehealthwidget-style-11" >
                    <div className="knowledgehealthwidget-style-12" >Robuste</div>
                    <div className="knowledgehealthwidget-style-13" >
                        <div className="knowledgehealthwidget-style-14" style={{
  width: getWidth(stats.counts.robuste)
}} />
                    </div>
                    <div className="knowledgehealthwidget-style-15" >
                        {stats.counts.robuste}
                    </div>
                </div>

                {/* Correct */}
                <div className="knowledgehealthwidget-style-16" >
                    <div className="knowledgehealthwidget-style-17" >Correct</div>
                    <div className="knowledgehealthwidget-style-18" >
                        <div className="knowledgehealthwidget-style-19" style={{
  width: getWidth(stats.counts.correct)
}} />
                    </div>
                    <div className="knowledgehealthwidget-style-20" >
                        {stats.counts.correct}
                    </div>
                </div>

                {/* Incomplet */}
                <div className="knowledgehealthwidget-style-21" >
                    <div className="knowledgehealthwidget-style-22" >Incomplet</div>
                    <div className="knowledgehealthwidget-style-23" >
                        <div className="knowledgehealthwidget-style-24" style={{
  // Orange stays orange or uses warning
  width: getWidth(stats.counts.incomplet)
}} />
                    </div>
                    <div className="knowledgehealthwidget-style-25" >
                        {stats.counts.incomplet}
                    </div>
                </div>

                {/* Ebauche */}
                <div className="knowledgehealthwidget-style-26" >
                    <div className="knowledgehealthwidget-style-27" >Ébauche</div>
                    <div className="knowledgehealthwidget-style-28" >
                        <div className="knowledgehealthwidget-style-29" style={{
  width: getWidth(stats.counts.ebauche)
}} />
                    </div>
                    <div className="knowledgehealthwidget-style-30" >
                        {stats.counts.ebauche}
                    </div>
                </div>

            </div>

            {/* Proactive weak-node suggestions (SRS-based) */}
            {topWeakNodes.length > 0 && (
                <div className="knowledgehealthwidget-style-31" >
                    <div className="knowledgehealthwidget-style-32" >
                        <Clock size={13} />
                        Nœuds à réviser en priorité
                    </div>
                    <div className="knowledgehealthwidget-style-33" >
                        {topWeakNodes.map(node => (
                            <div key={node.id} className="knowledgehealthwidget-style-34" >
                                <span className="knowledgehealthwidget-style-35" >
                                    {node.title}
                                </span>
                                <span className="knowledgehealthwidget-style-36" >
                                    {node.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer / Actions */}
            {stats.weakCount > 0 && (
                <div className="knowledgehealthwidget-style-37" style={{
  borderTop: topWeakNodes.length > 0 ? 'none' : '1px solid var(--color-border)'
}}>
                    <button
                        onClick={onReviewLowQuality}
                        className="knowledgehealthwidget-style-38" 
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
                <div className="knowledgehealthwidget-style-39" >
                    ✨ Votre cerveau est en pleine forme !
                </div>
            )}
        </div>
    );
};
