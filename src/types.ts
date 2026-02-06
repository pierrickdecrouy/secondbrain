export type CardType = 'drug' | 'patho' | 'physio' | 'data';

export interface Card {
    id: string;
    type: CardType;
    title: string;
    subtitle: string;
    content: string; // Plain text summary
    details: string; // HTML-like content with rich text
    tags: string[];
}
