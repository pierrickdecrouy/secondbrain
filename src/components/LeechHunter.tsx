import React, { useMemo } from 'react';
import { WarningCircle, Brain, ArrowRight } from '@phosphor-icons/react';
import { findSimilarCards } from '../semanticSearch';
import type { Card } from '../types';
import { useTheme } from '../context/ThemeContext';

interface LeechHunterProps {
    cards: Card[];
    onNavigate: (cardId: string) => void;
}

export const LeechHunter: React.FC<LeechHunterProps> = ({ cards, onNavigate }) => {
    const { darkMode: isDark } = useTheme();
    
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
        <article className="stats-panel glass-panel col-span-full mt-4" >
            <div className="flex items-center gap-2 mb-4" >
                <WarningCircle size={24} weight="duotone" className="text-red-500" />
                <h3 className="m-0" >Leech Hunter : Télémétrie Cognitive</h3>
            </div>
            <p className="text-[0.85rem] text-slate-500 mb-5" >
                Ces cartes vous posent problème (échecs répétés). Pour débloquer la mémorisation, nous vous suggérons de revoir la grappe sémantique associée afin de recréer du contexte.
            </p>

            <div className="flex flex-col gap-4" >
                {leechClusters.map(({ leech, relatedCards }) => (
                    <div key={leech.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4" style={{
  background: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)'
}}>
                        <div className="flex justify-between items-start mb-3" >
                            <div>
                                <h4 className="m-0 mb-1 text-base text-slate-900 dark:text-slate-100" >{leech.title}</h4>
                                <span className="text-[0.75rem] font-semibold text-red-500 px-2 py-0.5 rounded-full" style={{
  background: isDark ? '#451a1a' : '#fee2e2'
}}>
                                    Sangsue ({leech.progress?.lapses || 0} échecs)
                                </span>
                            </div>
                            <button 
                                onClick={() => onNavigate(leech.id)}
                                className="flex items-center gap-1 text-[0.8rem] font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none px-3 py-1.5 rounded-lg cursor-pointer" 
                            >
                                Voir
                            </button>
                        </div>
                        
                        {relatedCards.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800" >
                                <div className="flex items-center gap-1.5 mb-2 text-slate-500" >
                                    <Brain size={16} />
                                    <span className="text-[0.8rem] font-semibold" >Cluster sémantique suggéré :</span>
                                </div>
                                <div className="flex flex-wrap gap-2" >
                                    {relatedCards.map(neighbor => (
                                        <button 
                                            key={neighbor.id}
                                            onClick={() => onNavigate(neighbor.id)}
                                            className="flex items-center gap-1 text-[0.75rem] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md cursor-pointer transition-all duration-200" 
                                            
                                            
                                        >
                                            {neighbor.title}
                                            <ArrowRight size={12} className="text-slate-500"  />
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
