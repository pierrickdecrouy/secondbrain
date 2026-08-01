import React, { useMemo } from 'react';
import { WarningCircle, Brain, ArrowRight } from '@phosphor-icons/react';
import { findSimilarCards } from '../semanticSearch';
import type { Card } from '../types';
import { useTheme } from '../context/ThemeContext';
import './styles/LeechHunter.css';

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
        <article className="stats-panel glass-panel leechhunter-style-1" >
            <div className="leechhunter-style-2" >
                <WarningCircle size={24} weight="duotone" className="text-red-500" />
                <h3 className="leechhunter-style-3" >Leech Hunter : Télémétrie Cognitive</h3>
            </div>
            <p className="leechhunter-style-4" >
                Ces cartes vous posent problème (échecs répétés). Pour débloquer la mémorisation, nous vous suggérons de revoir la grappe sémantique associée afin de recréer du contexte.
            </p>

            <div className="leechhunter-style-5" >
                {leechClusters.map(({ leech, relatedCards }) => (
                    <div key={leech.id} className="leechhunter-style-6" style={{
  background: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)'
}}>
                        <div className="leechhunter-style-7" >
                            <div>
                                <h4 className="leechhunter-style-8" >{leech.title}</h4>
                                <span className="leechhunter-style-9" style={{
  background: isDark ? '#451a1a' : '#fee2e2'
}}>
                                    Sangsue ({leech.progress?.lapses || 0} échecs)
                                </span>
                            </div>
                            <button 
                                onClick={() => onNavigate(leech.id)}
                                className="leechhunter-style-10" 
                            >
                                Voir
                            </button>
                        </div>
                        
                        {relatedCards.length > 0 && (
                            <div className="leechhunter-style-11" >
                                <div className="leechhunter-style-12" >
                                    <Brain size={16} />
                                    <span className="leechhunter-style-13" >Cluster sémantique suggéré :</span>
                                </div>
                                <div className="leechhunter-style-14" >
                                    {relatedCards.map(neighbor => (
                                        <button 
                                            key={neighbor.id}
                                            onClick={() => onNavigate(neighbor.id)}
                                            className="leechhunter-style-15" 
                                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-physio)'}
                                            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                        >
                                            {neighbor.title}
                                            <ArrowRight size={12} className="leechhunter-style-16"  />
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
