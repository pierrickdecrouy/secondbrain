/**
 * Strips Markdown formatted text to plain text for preview summaries.
 */
export const stripMarkdown = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
        // Headers
        .replace(/^#+\s+/gm, '')
        // Bold/Italic
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Links
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Images
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
        // Blockquotes
        .replace(/^>\s+/gm, '')
        // Code blocks
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Lists
        .replace(/^[\s-]*[-+*]\s+/gm, '')
        // HTML tags (basic)
        .replace(/<[^>]*>/g, '')
        // Cloze deletion (||text|| -> text)
        .replace(/\|\|(.*?)\|\|/g, '$1')
        .trim();
};
