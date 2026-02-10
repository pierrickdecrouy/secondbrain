import React, { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw } from 'lucide-react';
import { localLLM, type LLMAnalysisResult } from '../services/LocalLLMService';
import { findSimilarCards, semanticSearch } from '../semanticSearch';
import type { Card } from '../types';

interface OraclePanelProps {
    card: Card;
    existingCards: Card[];
    existingConnections: Set<string>; // ID set of current manual connections
    onAddConnection: (targetId: string) => void;
}

interface Suggestion {
    targetCard: Card;
    result: LLMAnalysisResult;
}

export const OraclePanel: React.FC<OraclePanelProps> = ({
    card,
    existingCards,
    existingConnections,
    onAddConnection
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        setSuggestions([]);
        setProgress('Initialisation du modèle IA (peut prendre du temps la première fois)...');

        try {
            // 1. Initialize Model
            await localLLM.initialize((report) => {
                setProgress(report.text);
            });

            setProgress('Recherche de candidats sémantiques...');

            // 2. Find Candidates
            let candidateIds: string[] = [];

            // Try ID first
            const similar = findSimilarCards(card.id, 10);
            if (similar.length > 0) {
                candidateIds = similar.map((c: { id: string }) => c.id);
            } else {
                // Fallback to text search
                const query = `${card.title} ${card.content || ''} ${card.tags?.join(' ') || ''}`.trim();
                if (query.length > 5) {
                    candidateIds = await semanticSearch(query, 10);
                }
            }

            // Filter: remove existing connections and the card itself
            const uniqueCandidateIds = candidateIds
                .filter(id => id !== card.id && !existingConnections.has(id))
                .slice(0, 3); // Analyze top 3 to be fast

            if (uniqueCandidateIds.length === 0) {
                setError("Aucun nouveau candidat pertinent trouvé.");
                setIsAnalyzing(false);
                return;
            }

            // 3. Analyze each candidate with LLM
            const results: Suggestion[] = [];

            for (const candidateId of uniqueCandidateIds) {
                const targetCard = existingCards.find(c => c.id === candidateId);
                if (!targetCard) continue;

                setProgress(`Analyse de la relation avec "${targetCard.title}"...`);

                const analysis = await localLLM.checkConnection(card, targetCard);
                if (analysis.related) {
                    results.push({ targetCard, result: analysis });
                }
            }

            setSuggestions(results);
            if (results.length === 0) {
                setError("L'IA n'a pas trouvé de liens médicaux évidents parmi les candidats.");
            }

        } catch (err) {
            console.error(err);
            setError("Erreur lors de l'analyse (Vérifiez la console ou le support WebGPU).");
        } finally {
            setIsAnalyzing(false);
            setProgress('');
        }
    };

    return (
        <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Oracle IA (Local)</h3>
                </div>
                {!isAnalyzing && (
                    <button
                        onClick={handleAnalyze}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Lancer l'analyse
                    </button>
                )}
            </div>

            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 animate-pulse text-center max-w-[80%]">
                        {progress}
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3 mb-4 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-gray-700"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {suggestion.targetCard.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                                    Confiance: {Math.round(suggestion.result.confidence * 100)}%
                                </p>
                            </div>
                            <button
                                onClick={() => onAddConnection(suggestion.targetCard.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                                <Check className="w-3 h-3" />
                                Lier
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                            "{suggestion.result.reasoning}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
