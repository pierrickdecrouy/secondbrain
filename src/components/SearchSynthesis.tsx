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
    const [extraction, setExtraction] = useState<{ title: string; points: string[]; sources: string[] } | null>(null);
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
            borderRadius: 10,
            padding: isCollapsed ? '8px 12px' : '12px',
            marginBottom: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Brain size={14} color="#0ea5e9" />
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#0369a1' }}>
                        Points clés
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                        ({matchedCards.length} sources)
                    </span>
                </div>
                {isCollapsed ? <ChevronDown size={14} color="#64748b" /> : <ChevronUp size={14} color="#64748b" />}
            </div>

            {/* Content */}
            {!isCollapsed && extraction && extraction.points.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5, color: '#334155' }}>
                        {extraction.points.slice(0, 5).map((point, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
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
