/**
 * SearchSynthesis Component
 * Displays AI-generated synthesis from search results
 */

import React, { useEffect, useState } from 'react';
import type { Card } from '../types';
import { generateSearchSynthesis as generateExtraction } from '../synthesisService';
import { initLLM, generateSynthesis as generateLLM, isLLMReady } from '../llmService';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

interface SearchSynthesisProps {
    query: string;
    matchedCards: Card[];
}

export const SearchSynthesis: React.FC<SearchSynthesisProps> = ({ query, matchedCards }) => {
    const [synthesis, setSynthesis] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [llmReady, setLlmReady] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [extraction, setExtraction] = useState<{ title: string; points: string[]; sources: string[] } | null>(null);

    // Initial check and load
    useEffect(() => {
        // Always do basic extraction first (fast)
        if (query && matchedCards.length > 0) {
            setExtraction(generateExtraction(query, matchedCards));
            // Reset synthesis when query changes
            setSynthesis('');
        }

        // Check LLM status
        if (isLLMReady()) {
            setLlmReady(true);
        } else {
            // Start loading in background if not ready
            initLLM(
                (progress) => setLoadProgress(progress),
                () => setLlmReady(true)
            ).catch(console.error);
        }
    }, [query, matchedCards]);

    // Generate AI response when ready and stable
    useEffect(() => {
        if (!query || query.length < 3 || matchedCards.length === 0 || !llmReady) return;

        // Debounce generation
        const timer = setTimeout(async () => {
            setIsGenerating(true);
            try {
                const result = await generateLLM(query, matchedCards.map(c => ({
                    title: c.title,
                    content: c.content || ''
                })));
                if (result) setSynthesis(result);
            } catch (error) {
                console.error('Generation failed:', error);
            } finally {
                setIsGenerating(false);
            }
        }, 1200); // 1.2s delay to avoid too many requests

        return () => clearTimeout(timer);
    }, [query, matchedCards, llmReady]);

    if (!query || query.length < 2 || matchedCards.length === 0) {
        return null;
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12
            }}>
                {llmReady && synthesis ? (
                    <Sparkles size={18} color="#0ea5e9" />
                ) : (
                    <Brain size={18} color="#64748b" />
                )}

                <span style={{ fontSize: 16, fontWeight: 500, color: '#0f172a' }}>
                    {synthesis ? 'Synthèse IA' : 'Synthèse (Aperçu)'}
                </span>

                {!llmReady && (
                    <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 10 }}>
                        Chargement modèle {Math.round(loadProgress)}%
                    </span>
                )}

                {isGenerating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Loader2 size={14} className="animate-spin" color="#0ea5e9" />
                        <span style={{ fontSize: 11, color: '#0ea5e9' }}>Génération...</span>
                    </div>
                )}
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#1e3a5f' }}>
                {synthesis ? (
                    <div dangerouslySetInnerHTML={{ __html: synthesis.replace(/\n/g, '<br/>') }} />
                ) : extraction && extraction.points.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {extraction.points.map((point, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>{point}</li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                        Analyse des résultats en cours...
                    </div>
                )}
            </div>

            <div style={{
                marginTop: 12,
                fontSize: 11,
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>Sources: {matchedCards.length} fiches</span>
                {llmReady && !synthesis && !isGenerating && (
                    <span style={{ color: '#0ea5e9', cursor: 'pointer' }} onClick={() => setLlmReady(true)}>
                        Régénérer
                    </span>
                )}
            </div>
        </div>
    );
};

export default SearchSynthesis;
