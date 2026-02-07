export type CardType = string;

export interface Card {
    id: string;
    type: CardType;
    title: string;
    subtitle: string;
    content: string; // Plain text summary
    details: string; // Markdown content (supports rich text)
    tags: string[];
    imageUrl?: string; // Optional image URL or local path
}
