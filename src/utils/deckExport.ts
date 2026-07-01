import type { Card } from '../types';

export function exportDeckToJson(course: Card, allCards: Card[]) {
    // Collect all cards related to this course
    // 1. The course itself
    // 2. Concepts where parentId === course.id
    // 3. Flashcards where parentId === course.id OR parentId is one of the concepts
    
    const concepts = allCards.filter(c => c.nodeType === 'concept' && c.parentId === course.id);
    const conceptIds = new Set(concepts.map(c => c.id));
    const flashcards = allCards.filter(c => c.nodeType === 'flashcard' && (c.parentId === course.id || (c.parentId && conceptIds.has(c.parentId))));
    
    const deckCards = [course, ...concepts, ...flashcards];
    
    const dataStr = JSON.stringify(deckCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (course.title || 'course').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `deck_${safeTitle}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
