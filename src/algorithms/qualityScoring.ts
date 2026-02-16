import type { Card } from '../types';

export interface QualityMetrics {
    contentScore: number;    // 0-40 points for content length/structure
    connectivityScore: number; // 0-30 points for links
    metadataScore: number;   // 0-30 points for tags/type/images
    total: number;           // 0-100
}

export interface QualityAssessment {
    score: number;
    label: 'Ébauche' | 'Incomplet' | 'Correct' | 'Robuste' | 'Excellence';
    color: string;
    details: QualityMetrics;
}

/**
 * Computes a quality score for a card to encourage better documentation
 */
export function calculateQualityScore(card: Card, connectivityCount: number = 0): QualityAssessment {
    let contentScore = 0;
    let metadataScore = 0;
    let connectivityScore = 0;

    // 1. Content Analysis (Max 40)
    const text = (card.details || card.content || '').trim();
    const length = text.length;

    // Length milestones
    if (length > 50) contentScore += 5;
    if (length > 200) contentScore += 10;
    if (length > 500) contentScore += 10;
    if (length > 1000) contentScore += 5; // Creating a plateau

    // Structure bonuses
    if (text.includes('# ')) contentScore += 3; // Headings
    if (text.includes('- ') || text.includes('* ')) contentScore += 3; // Lists
    if (text.includes('```') || text.includes('`')) contentScore += 2; // Code/Technical
    if (text.includes('|') && text.includes('--')) contentScore += 2; // Tables

    contentScore = Math.min(contentScore, 40);

    // 2. Metadata & Enrichment (Max 30)
    // Tags
    if (card.tags?.length > 0) metadataScore += 5;
    if (card.tags?.length > 2) metadataScore += 5;
    if (card.tags?.length > 5) metadataScore += 5;

    // Subtitle
    if (card.subtitle && card.subtitle.length > 5) metadataScore += 5;

    // Image
    if (card.imageUrl) metadataScore += 10;

    metadataScore = Math.min(metadataScore, 30);

    // 3. Connectivity (Max 30)
    // Basic presence
    if (connectivityCount > 0) connectivityScore += 5;
    if (connectivityCount > 2) connectivityScore += 10;
    if (connectivityCount > 5) connectivityScore += 10;
    if (connectivityCount > 10) connectivityScore += 5;

    connectivityScore = Math.min(connectivityScore, 30);

    const total = contentScore + metadataScore + connectivityScore;

    // Determine Label & Color
    let label: QualityAssessment['label'] = 'Ébauche';
    let color = '#94a3b8'; // Slate 400

    if (total >= 90) {
        label = 'Excellence';
        color = '#f59e0b'; // Amber 500 (Gold)
    } else if (total >= 70) {
        label = 'Robuste';
        color = '#10b981'; // Emerald 500
    } else if (total >= 50) {
        label = 'Correct';
        color = '#3b82f6'; // Blue 500
    } else if (total >= 30) {
        label = 'Incomplet';
        color = '#f97316'; // Orange 500
    }

    return {
        score: total,
        label,
        color,
        details: { contentScore, connectivityScore, metadataScore, total }
    };
}
