import type { Card } from '../types';

/**
 * Knowledge Quality Scoring System
 * Evaluates the "richness" and "reliability" of a card.
 * 
 * Factors:
 * 1. Content Depth (40%): Word count, structure (headers, lists).
 * 2. Connectivity (30%): Number of manual and semantic connections.
 * 3. Metadata Completeness (20%): Tags, Subtitle, Type.
 * 4. Updates (10%): Has it been refined over time?
 */

export interface QualityScore {
    score: number; // 0-100
    label: 'Stub' | 'Basic' | 'Good' | 'Excellent' | 'Masterpiece';
    color: string;
    details: {
        contentScore: number;
        connectivityScore: number;
        metadataScore: number;
    };
}

export function calculateQualityScore(card: Card, semanticNeighborCount: number = 0): QualityScore {
    // 1. Content Depth (Max 40 points)
    const text = (card.content || '') + ' ' + (card.details || '');
    const wordCount = text.split(/\s+/).length;
    let contentScore = Math.min(20, wordCount / 5); // 100 words = 20 pts

    // Bonus for structure (Markdown headers, lists)
    if (text.includes('# ')) contentScore += 5;
    if (text.includes('- ') || text.includes('* ')) contentScore += 5;
    if (text.length > 500) contentScore += 10; // Extra length bonus

    contentScore = Math.min(40, contentScore);

    // 2. Connectivity (Max 30 points)
    // Manual connections are worth more (intentional knowledge)
    const manualCount = (card.manualConnections || []).length;
    let connectivityScore = (manualCount * 5) + (semanticNeighborCount * 1);
    connectivityScore = Math.min(30, connectivityScore);

    // 3. Metadata Completeness (Max 30 points)
    let metadataScore = 0;
    if (card.tags && card.tags.length > 0) metadataScore += 10;
    if (card.tags && card.tags.length > 3) metadataScore += 5; // Good categorization
    if (card.subtitle && card.subtitle.length > 5) metadataScore += 10;
    if (card.type && card.type !== 'data') metadataScore += 5; // Specific types are better than generic 'data'

    // Total Calculation
    const totalScore = Math.round(contentScore + connectivityScore + metadataScore);

    return {
        score: totalScore,
        label: getLabel(totalScore),
        color: getColor(totalScore),
        details: {
            contentScore,
            connectivityScore,
            metadataScore
        }
    };
}

function getLabel(score: number): QualityScore['label'] {
    if (score >= 90) return 'Masterpiece';
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Basic';
    return 'Stub';
}

function getColor(score: number): string {
    if (score >= 90) return '#10b981'; // Emerald 500
    if (score >= 70) return '#34d399'; // Emerald 400
    if (score >= 50) return '#60a5fa'; // Blue 400
    if (score >= 30) return '#facc15'; // Yellow 400
    return '#fbbf24'; // Amber 400
}
