/**
 * SearchSynthesis Component
 * Displays extracted key points from search results (LLM disabled due to hallucinations)
 */

import React, { useEffect, useState } from 'react';
import type { Card } from '../types';
import { generateSearchSynthesis as generateExtraction } from '../synthesisService';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SearchSynthesisProps {
    query: string;
    matchedCards: Card[];
}

export const SearchSynthesis: React.FC<SearchSynthesisProps> = ({ query, matchedCards }) => {
    const [extraction, setExtraction] = useState<{ title: string; points: string[]; sources: string[]; keywords: string[] } | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (query && matchedCards.length > 0) {
            setExtraction(generateExtraction(query, matchedCards));
        }
    }, [query, matchedCards]);

    if (!query || query.length < 2 || matchedCards.length === 0) {
        return null;
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: 16,
            padding: isCollapsed ? '10px 16px' : '16px',
            marginBottom: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        background: 'white',
                        padding: 6,
                        borderRadius: '50%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <Brain size={16} color="#0ea5e9" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
                                Synthèse & Concepts
                            </span>
                            {/* Keywords / Concepts Badge Row in Header */}
                            {extraction && extraction.keywords && !isCollapsed && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {extraction.keywords.slice(0, 3).map(kw => (
                                        <span key={kw} style={{
                                            fontSize: 10,
                                            background: 'rgba(255,255,255,0.6)',
                                            color: '#0369a1',
                                            padding: '2px 6px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(14, 165, 233, 0.2)',
                                            fontWeight: 500
                                        }}>
                                            {kw}
                                        </span>
                                    ))}
                                    {extraction.keywords.length > 3 && (
                                        <span style={{ fontSize: 10, color: '#0369a1', padding: '2px 4px' }}>
                                            +{extraction.keywords.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 1 }}>
                            Analyse de {matchedCards.length} fiches pertinentes
                        </span>
                    </div>
                </div>
                {isCollapsed ? <ChevronDown size={16} color="#64748b" /> : <ChevronUp size={16} color="#64748b" />}
            </div>

            {/* Content */}
            {!isCollapsed && extraction && extraction.points.length > 0 && (
                <div style={{ marginTop: 14, paddingLeft: 4 }}>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
                        {extraction.points.slice(0, 5).map((point, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                                <MarkdownRenderer content={point} className="inline" />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchSynthesis;
