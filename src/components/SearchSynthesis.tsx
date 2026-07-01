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
        <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: isCollapsed ? '12px 20px' : '20px',
            marginBottom: 24,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Shimmer effect at the top */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc, #38bdf8)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite linear'
            }} />

            {/* Collapsible header */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        padding: 8,
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Brain size={20} color="#0284c7" weight="duotone" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                                Synthèse IA
                            </span>
                            {!isCollapsed && (
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, fontWeight: 600, color: '#0ea5e9',
                                    background: '#f0f9ff', padding: '2px 8px', borderRadius: 12,
                                    border: '1px solid #bae6fd'
                                }}>
                                    <Sparkle size={12} weight="fill" /> Sémantique
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginTop: 2, fontWeight: 500 }}>
                            Analyse de {matchedCards.length} sources pertinentes
                        </span>
                    </div>
                </div>
                {isCollapsed ? <CaretDown size={20} color="#94a3b8" /> : <CaretUp size={20} color="#94a3b8" />}
            </div>

            {/* Content */}
            {!isCollapsed && extraction && extraction.points.length > 0 && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {extraction.points.map((point, i) => {
                        const typeColor = point.source.type === 'relation' ? '#8b5cf6' : getCategoryColor(point.source.type);
                        const typeIcon = point.source.type === 'relation' ? 'Link' : getCategoryIcon(point.source.type);
                        
                        return (
                            <div key={i} style={{ 
                                display: 'flex', 
                                gap: 12, 
                                alignItems: 'flex-start',
                                animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`
                            }}>
                                <div 
                                    onClick={() => point.source.id && onCardClick(point.source.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        backgroundColor: `${typeColor}15`,
                                        border: `1px solid ${typeColor}30`,
                                        color: typeColor,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: point.source.type === 'relation' ? 'default' : 'pointer',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s',
                                        marginTop: '2px',
                                        flexShrink: 0
                                    }}
                                    onMouseOver={(e) => {
                                        if (point.source.type !== 'relation') {
                                            e.currentTarget.style.backgroundColor = `${typeColor}25`;
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (point.source.type !== 'relation') {
                                            e.currentTarget.style.backgroundColor = `${typeColor}15`;
                                            e.currentTarget.style.transform = 'none';
                                        }
                                    }}
                                >
                                    {point.source.type === 'relation' ? <Sparkle size={12} weight="fill" /> : <DynamicIcon name={typeIcon} size={12} />}
                                    {point.source.title.length > 20 ? point.source.title.substring(0, 18) + '...' : point.source.title}
                                </div>
                                <div style={{ 
                                    fontSize: '0.9rem', 
                                    lineHeight: 1.5, 
                                    color: 'var(--color-text)',
                                    flex: 1
                                }}>
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
