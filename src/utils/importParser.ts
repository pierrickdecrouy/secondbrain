import type { Card, CardType } from '../types';

type ImportCandidate = Partial<Card> & Record<string, unknown>;

export const pickString = (...values: unknown[]): string => {
    const first = values.find((v): v is string => typeof v === 'string' && v.trim().length > 0);
    return first ? first : '';
};

export const sanitizeText = (text: string): string => text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

export const generateSafeId = (title: string): string => {
    return sanitizeText(title).toLowerCase()
        .replace(/[^a-z0-9à-ÿ]+/gi, '-')
        .replace(/^-+|-+$/g, '');
};

export const parseTextFormat = (text: string, defaultCardType: CardType, groupName: string): Card[] => {
    const cards: Card[] = [];
    const lines = text.split('\n');
    
    const rawSections: string[][] = [];
    let currentSection: string[] = [];

    lines.forEach(line => {
        if (line.trim().startsWith('#') && !line.trim().startsWith('##')) {
            if (currentSection.length > 0) {
                rawSections.push(currentSection);
            }
            currentSection = [line.replace(/^\s*#\s*/, '')];
        } else {
            if (currentSection.length > 0) {
                currentSection.push(line);
            }
        }
    });
    if (currentSection.length > 0) {
        rawSections.push(currentSection);
    }

    rawSections.forEach(sectionLines => {
        if (sectionLines.length === 0) return;

        const rawTitle = sectionLines[0].trim();
        if (!rawTitle) return;

        const title = sanitizeText(rawTitle);
        const extractedTags: string[] = [];
        let subject = '';
        
        let subtitle = '';
        const contentLines: string[] = [];
        
        let parsingMetadata = true;
        let subtitleFound = false;

        sectionLines.slice(1).forEach(line => {
            const trimmed = line.trim();
            
            if (parsingMetadata) {
                const tagMatch = trimmed.match(/^\[([^\]]+)\]$/);
                const subjectMatch = trimmed.match(/^(?:Subject|Matière|Matiere|Module)\s*:\s*(.+)$/i);
                
                if (tagMatch) {
                    const tags = tagMatch[1].split(',').map(t => sanitizeText(t.trim())).filter(Boolean);
                    extractedTags.push(...tags);
                    return;
                } else if (subjectMatch) {
                    subject = sanitizeText(subjectMatch[1]);
                    return;
                } else if (trimmed === '') {
                    return;
                } else if (!subtitleFound && !trimmed.startsWith('##')) {
                    subtitle = sanitizeText(trimmed);
                    subtitleFound = true;
                    return;
                } else {
                    parsingMetadata = false;
                }
            }
            contentLines.push(line);
        });

        const details = contentLines.join('\n').trim();

        cards.push({
            id: generateSafeId(title),
            type: defaultCardType,
            title,
            subtitle,
            content: details || subtitle,
            details: details || subtitle,
            tags: [
                ...extractedTags,
                ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
            ],
            subject: subject || undefined,
        });
    });

    return cards;
};

export const parseJsonFormat = (jsonString: string, defaultCardType: CardType, groupName: string): Card[] => {
    const parsed = JSON.parse(jsonString);
    let validCards: ImportCandidate[] = [];

    if (Array.isArray(parsed)) {
        validCards = parsed.filter((c: ImportCandidate) => !!pickString(c.title, c.Title, c.name, c.Name));
    } else if (typeof parsed === 'object' && parsed !== null) {
        const parsedCandidate = parsed as ImportCandidate;
        if (pickString(parsedCandidate.title, parsedCandidate.Title, parsedCandidate.name, parsedCandidate.Name)) {
            validCards = [parsed];
        }
    } else {
        throw new Error("Le JSON doit être un tableau d'objets ou un objet unique.");
    }

    return validCards.map((c) => {
        const title = sanitizeText(pickString(c.title, c.Title, c.name, c.Name));
        return {
            ...c,
            id: pickString(c.id) ? sanitizeText(pickString(c.id)) : generateSafeId(title),
            title: title,
            type: (pickString(c.type) as CardType) || defaultCardType,
            tags: [
                ...(Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === 'string') : []),
                ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
            ],
            subtitle: sanitizeText(pickString(c.subtitle)),
            content: sanitizeText(pickString(c.content)),
            details: sanitizeText(pickString(c.details, c.content)),
            subject: pickString(c.subject, c.Subject, c.matiere, c.Matiere, c.module, c.Module) ? sanitizeText(pickString(c.subject, c.Subject, c.matiere, c.Matiere, c.module, c.Module)) : undefined,
        } as Card;
    });
};
