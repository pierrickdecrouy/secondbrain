/**
 * SearchSynthesis Component
 * Displays extracted key points from search results (LLM disabled due to hallucinations)
 */

import React, { useEffect, useState } from 'react';
import type { Card } from '../types';
import { generateSearchSynthesis as generateExtraction } from '../synthesisService';
import { Brain, CaretDown, CaretUp, Sparkle } from '@phosphor-icons/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';
import './styles/SearchSynthesis.css';

interface SearchSynthesisProps {
    query: string;
    matchedCards: Card[];
    allCards: Card[]; // Added for Graph-RAG context expansion
    onCardClick: (id: string) => void;
}

export const SearchSynthesis: React.FC<SearchSynthesisProps> = ({ query, matchedCards, allCards, onCardClick }) => {
    const { getCategoryColor, getCategoryIcon } = useTheme();
    const [extraction, setExtraction] = useState<{
        title: string;
        points: { text: string; source: { id: string; title: string; type: string } }[];
        sources: string[];
        keywords: string[]
    } | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (query && matchedCards.length > 0) {
            // Reset visibility and extraction together in a single batched update.
            // React 18 batches these automatically when they are in the same
            // synchronous call, but we are explicit here for clarity.
            setIsVisible(false);
            const ext = generateExtraction(query, matchedCards, allCards);
            setExtraction(ext);
            // Defer the visibility toggle to the next paint so the CSS
            // transition actually fires (same as before, but no extra render).
            const id = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(id);
        }
    }, [query, matchedCards, allCards]);

    if (!query || query.length < 2 || matchedCards.length === 0) {
        return null;
    }

    return (
        <div 
            className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-md transition-all duration-300 relative overflow-hidden dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 ${isCollapsed ? 'py-3 px-5' : 'p-5'} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'}`}
        >
            {/* Shimmer effect at the top */}
            {/* Shimmer effect at the top */}
            <div 
                className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,#38bdf8,#818cf8,#c084fc,#38bdf8)] bg-[length:200%_100%] searchsynthesis-style-1"
                 
            />

            {/* Collapsible header */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-between cursor-pointer select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-sky-100 to-sky-200 p-2 rounded-xl shadow-[0_2px_4px_rgba(14,165,233,0.2)] flex items-center justify-center">
                        <Brain size={20} color="#0284c7" weight="duotone" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[15px] font-bold text-[color:var(--color-text)] tracking-[-0.01em]">
                                Synthèse IA
                            </span>
                            {!isCollapsed && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                                    <Sparkle size={12} weight="fill" /> Sémantique
                                </span>
                            )}
                        </div>
                        <span className="text-[12px] text-[color:var(--color-text-muted)] block mt-0.5 font-medium">
                            Analyse de {matchedCards.length} sources pertinentes
                        </span>
                    </div>
                </div>
                {isCollapsed ? <CaretDown size={20} color="#94a3b8" /> : <CaretUp size={20} color="#94a3b8" />}
            </div>

            {/* Content */}
            {!isCollapsed && extraction && extraction.points.length > 0 && (
                <div className="mt-5 flex flex-col gap-3">
                    {extraction.points.map((point, i) => {
                        const typeColor = point.source.type === 'relation' ? '#8b5cf6' : getCategoryColor(point.source.type);
                        const typeIcon = point.source.type === 'relation' ? 'Link' : getCategoryIcon(point.source.type);
                        
                        return (
                            <div key={i} className="flex gap-3 items-start" style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}>
                                <div 
                                    onClick={() => point.source.id && onCardClick(point.source.id)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-[0.75rem] font-bold whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 mt-0.5 shrink-0 ${point.source.type === 'relation' ? 'cursor-default' : 'cursor-pointer hover:-translate-y-[1px]'}`}
                                    style={{
                                        backgroundColor: `${typeColor}15`,
                                        border: `1px solid ${typeColor}30`,
                                        color: typeColor,
                                    }}
                                    onMouseOver={(e) => {
                                        if (point.source.type !== 'relation') {
                                            e.currentTarget.style.backgroundColor = `${typeColor}25`;
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (point.source.type !== 'relation') {
                                            e.currentTarget.style.backgroundColor = `${typeColor}15`;
                                        }
                                    }}
                                >
                                    {point.source.type === 'relation' ? <Sparkle size={12} weight="fill" /> : <DynamicIcon name={typeIcon} size={12} />}
                                    {point.source.title.length > 20 ? point.source.title.substring(0, 18) + '...' : point.source.title}
                                </div>
                                <div className="text-[0.9rem] leading-relaxed text-[color:var(--color-text)] flex-1">
                                    <MarkdownRenderer 
                                        content={point.text.replace(`**${point.source.title}** : `, '').replace(`📌 **${point.source.title}** : `, '')} 
                                        className="inline" 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <style>
                {`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default SearchSynthesis;
