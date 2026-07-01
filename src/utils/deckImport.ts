import type { Card } from '../types';
import { generateId } from '../types';
import { CardSchema } from '../schema';

export async function importDeckFromJson(file: File): Promise<Card[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                
                if (!Array.isArray(parsed)) {
                    throw new Error("Le fichier ne contient pas un format valide de deck (tableau de cartes attendu).");
                }
                
                const idMap = new Map<string, string>(); // oldId -> newId
                
                // First pass: Generate new IDs for all cards and validate
                const mappedCards: Card[] = parsed.map((cardData: any) => {
                    const parsedCard = CardSchema.parse(cardData) as Card;
                    const newId = generateId();
                    idMap.set(parsedCard.id, newId);
                    
                    return {
                        ...parsedCard,
                        id: newId,
                        // Reset dates and owner so they are treated as new
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        ownerUid: null, 
                        // Note: ownerUid will be correctly stamped by handleSaveCard or handleBatchImport
                    };
                });
                
                // Second pass: Update all relational IDs (parentId, connections)
                mappedCards.forEach(card => {
                    if (card.parentId && idMap.has(card.parentId)) {
                        card.parentId = idMap.get(card.parentId)!;
                    }
                    if (card.manualConnections) {
                        card.manualConnections = card.manualConnections.map(id => idMap.has(id) ? idMap.get(id)! : id);
                    }
                    if (card.suppressedConnections) {
                        card.suppressedConnections = card.suppressedConnections.map(id => idMap.has(id) ? idMap.get(id)! : id);
                    }
                });
                
                resolve(mappedCards);
            } catch (err) {
                console.error("Erreur lors de l'import du deck:", err);
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
        reader.readAsText(file);
    });
}
