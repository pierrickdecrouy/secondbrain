
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm w-full max-w-[480px]" >
            {/* Header */}
            <div className="flex justify-between items-center mb-6" >
                <div className="text-[1.1rem] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5" >
                    <Brain size={24} color="var(--color-drug)" />
                    Solidité des Connaissances
                </div>
                <span className="text-xs text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full" >
                    {stats.total} fiches
                </span>
            </div>

            {/* Stats Bars */}
            <div className="flex flex-col gap-3.5" >

                {/* Excellence */}
                <div className="flex items-center text-[0.85rem]" >
                    <div className="w-[85px] font-medium text-slate-900 dark:text-slate-100" >Excellence</div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 overflow-hidden" >
                        <div className="h-full bg-emerald-500 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
  width: getWidth(stats.counts.excellence)
}} />
                    </div>
                    <div className="w-[30px] text-right font-semibold text-slate-900 dark:text-slate-100" >
                        {stats.counts.excellence}
                    </div>
                </div>

                {/* Robuste */}
                <div className="flex items-center text-[0.85rem]" >
                    <div className="w-[85px] font-medium text-slate-900 dark:text-slate-100" >Robuste</div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 overflow-hidden" >
                        <div className="h-full bg-teal-500 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
  width: getWidth(stats.counts.robuste)
}} />
                    </div>
                    <div className="w-[30px] text-right font-semibold text-slate-900 dark:text-slate-100" >
                        {stats.counts.robuste}
                    </div>
                </div>

                {/* Correct */}
                <div className="flex items-center text-[0.85rem]" >
                    <div className="w-[85px] font-medium text-slate-900 dark:text-slate-100" >Correct</div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 overflow-hidden" >
                        <div className="h-full bg-blue-500 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
  width: getWidth(stats.counts.correct)
}} />
                    </div>
                    <div className="w-[30px] text-right font-semibold text-slate-900 dark:text-slate-100" >
                        {stats.counts.correct}
                    </div>
                </div>

                {/* Incomplet */}
                <div className="flex items-center text-[0.85rem]" >
                    <div className="w-[85px] font-medium text-slate-900 dark:text-slate-100" >Incomplet</div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 overflow-hidden" >
                        <div className="h-full bg-orange-500 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
  // Orange stays orange or uses warning
  width: getWidth(stats.counts.incomplet)
}} />
                    </div>
                    <div className="w-[30px] text-right font-semibold text-slate-900 dark:text-slate-100" >
                        {stats.counts.incomplet}
                    </div>
                </div>

                {/* Ebauche */}
                <div className="flex items-center text-[0.85rem]" >
                    <div className="w-[85px] font-medium text-slate-900 dark:text-slate-100" >Ébauche</div>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 overflow-hidden" >
                        <div className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
  width: getWidth(stats.counts.ebauche)
}} />
                    </div>
                    <div className="w-[30px] text-right font-semibold text-slate-900 dark:text-slate-100" >
                        {stats.counts.ebauche}
                    </div>
                </div>

            </div>

            {/* Proactive weak-node suggestions (SRS-based) */}
            {topWeakNodes.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800" >
                    <div className="text-[0.8rem] font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5" >
                        <Clock size={13} />
                        Nœuds à réviser en priorité
                    </div>
                    <div className="flex flex-col gap-2" >
                        {topWeakNodes.map(node => (
                            <div key={node.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[0.82rem]" >
                                <span className="font-semibold text-slate-900 dark:text-slate-100 flex-1 overflow-hidden text-ellipsis whitespace-nowrap" >
                                    {node.title}
                                </span>
                                <span className="text-red-500 ml-2 shrink-0 text-[0.78rem]" >
                                    {node.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer / Actions */}
            {stats.weakCount > 0 && (
                <div className="mt-5 pt-5 flex justify-end" style={{
  borderTop: topWeakNodes.length > 0 ? 'none' : '1px solid var(--color-border)'
}}>
                    <button
                        onClick={onReviewLowQuality}
                        className="bg-slate-50 dark:bg-slate-950 text-red-500 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg font-semibold text-[0.85rem] cursor-pointer flex items-center gap-2 transition-all duration-200" 
                        
                        
                    >
                        <WarningCircle size={16} />
                        Réviser les {stats.weakCount} fiches faibles
                    </button>
                </div>
            )}

            {stats.weakCount === 0 && stats.total > 0 && topWeakNodes.length === 0 && (
                <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800 text-center text-teal-500 text-[0.9rem] font-medium" >
                    ✨ Votre cerveau est en pleine forme !
                </div>
            )}
        </div>
    );
};
