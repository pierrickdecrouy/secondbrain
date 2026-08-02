import React, { useMemo } from 'react';
import { WarningCircle, Brain, ArrowRight } from '@phosphor-icons/react';
import { findSimilarCards } from '../semanticSearch';
import type { Card } from '../types';

interface LeechHunterProps {
    cards: Card[];
    onNavigate: (cardId: string) => void;
}

export const LeechHunter: React.FC<LeechHunterProps> = ({ cards, onNavigate }) => {
    // Identify leeches (isLeech or > 3 lapses)
    const leeches = useMemo(() => {
        return cards.filter(c => c.progress?.isLeech || (c.progress?.lapses && c.progress.lapses > 3));
    }, [cards]);

    // Compute semantic systemic clusters for leeches
    const leechClusters = useMemo(() => {
        const cardMap = new Map(cards.map(c => [c.id, c]));
        return leeches.map(leech => {
            // Find 3 nearest semantic neighbors to suggest systemic review
            const neighbors = findSimilarCards(leech.id, 3);
            const relatedCards = neighbors
                .map(n => cardMap.get(n.id))
                .filter((c): c is Card => c !== undefined && c.type !== 'course');
            
            return { leech, relatedCards };
        }).sort((a, b) => (b.leech.progress?.lapses || 0) - (a.leech.progress?.lapses || 0));
    }, [leeches, cards]);

    if (leeches.length === 0) return null;

    return (
        <article className="lg:col-span-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm mt-4 flex flex-col" >
            <div className="flex items-center gap-3 mb-3" >
                <div className="w-10 h-10 bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center rounded-xl shrink-0">
                    <WarningCircle size={22} weight="duotone" />
                </div>
                <div>
                    <h3 className="m-0 text-lg font-bold text-slate-900 dark:text-white" >Leech Hunter : Télémétrie Cognitive</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0 mt-0.5" >
                        Ces cartes vous posent problème (échecs répétés). Re-contextualisez-les avec leurs grappes sémantiques.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-5" >
                {leechClusters.map(({ leech, relatedCards }) => (
                    <div key={leech.id} className="bg-slate-50 dark:bg-[#0c0c0f] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4" >
                            <div>
                                <h4 className="m-0 mb-2 text-base font-bold text-slate-900 dark:text-slate-100" >{leech.title}</h4>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    Sangsue ({leech.progress?.lapses || 0} échecs)
                                </span>
                            </div>
                            <button 
                                onClick={() => onNavigate(leech.id)}
                                className="flex items-center justify-center gap-2 text-sm font-bold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 border-none px-4 py-2 rounded-xl cursor-pointer transition-colors shrink-0" 
                            >
                                Revoir <ArrowRight size={14} weight="bold" />
                            </button>
                        </div>
                        
                        {relatedCards.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800" >
                                <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400" >
                                    <Brain size={16} weight="bold" />
                                    <span className="text-xs font-bold uppercase tracking-wider" >Cluster sémantique suggéré</span>
                                </div>
                                <div className="flex flex-wrap gap-2" >
                                    {relatedCards.map(neighbor => (
                                        <button 
                                            key={neighbor.id}
                                            onClick={() => onNavigate(neighbor.id)}
                                            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg cursor-pointer transition-all" 
                                        >
                                            {neighbor.title}
                                            <ArrowRight size={12} weight="bold" className="opacity-50"  />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </article>
    );
};
