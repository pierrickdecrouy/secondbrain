import Papa from 'papaparse';
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
    
    const rawSections: { type: 'course' | 'concept' | 'flashcard', lines: string[] }[] = [];
    let currentSection: { type: 'course' | 'concept' | 'flashcard', lines: string[] } | null = null;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
            if (currentSection) {
                rawSections.push(currentSection);
            }
            let type: 'course' | 'concept' | 'flashcard' = 'flashcard';
            if (trimmed.startsWith('# ')) type = 'course';
            else if (trimmed.startsWith('## ')) type = 'concept';
            
            currentSection = {
                type,
                lines: [trimmed.replace(/^#+\s*/, '')]
            };
        } else {
            if (currentSection) {
                currentSection.lines.push(line);
            } else if (trimmed.length > 0) {
                currentSection = { type: 'flashcard', lines: [line] };
            }
        }
    });
    if (currentSection) {
        rawSections.push(currentSection);
    }

    let lastCourseId: string | undefined = undefined;
    let lastConceptId: string | undefined = undefined;

    rawSections.forEach(section => {
        if (section.lines.length === 0) return;

        const rawTitle = section.lines[0].trim();
        if (!rawTitle) return;

        const title = sanitizeText(rawTitle);
        const extractedTags: string[] = [];
        const extractedLinks: string[] = [];
        let subject = '';
        
        let subtitle = '';
        const contentLines: string[] = [];
        
        let parsingMetadata = true;
        let subtitleFound = false;

        section.lines.slice(1).forEach(line => {
            const trimmed = line.trim();
            
            if (parsingMetadata) {
                const tagMatch = trimmed.match(/^\[([^\]]+)\]$/);
                const subjectMatch = trimmed.match(/^(?:Subject|Matière|Matiere|Module|Type)\s*:\s*(.+)$/i);
                const linkMatch = trimmed.match(/^(?:Liens|Links|Cartes [Ll]i[ée]es)\s*:\s*(.+)$/i);
                
                if (tagMatch) {
                    const tags = tagMatch[1].split(',').map(t => sanitizeText(t.trim())).filter(Boolean);
                    extractedTags.push(...tags);
                    return;
                } else if (subjectMatch) {
                    subject = sanitizeText(subjectMatch[1]);
                    return;
                } else if (linkMatch) {
                    const links = linkMatch[1].split(',').map(t => sanitizeText(t.trim())).filter(Boolean);
                    extractedLinks.push(...links);
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
        // Generate a random suffix to avoid collisions in mass imports with similar names
        const id = generateSafeId(title) + '-' + Math.random().toString(36).substring(2, 6);

        let parentId: string | undefined = undefined;
        if (section.type === 'course') {
            lastCourseId = id;
            lastConceptId = undefined;
        } else if (section.type === 'concept') {
            lastConceptId = id;
            parentId = lastCourseId;
        } else if (section.type === 'flashcard') {
            parentId = lastConceptId || lastCourseId;
        }

        let resolvedType = defaultCardType;
        if (subject && ['drug', 'patho', 'physio', 'data', 'concept'].includes(subject.toLowerCase())) {
            resolvedType = subject.toLowerCase() as CardType;
        }

        cards.push({
            id,
            type: resolvedType,
            nodeType: section.type,
            ...(section.type === 'flashcard' ? { format: 'q&a' } : {}),
            ...(parentId ? { parentId } : {}),
            title,
            subtitle,
            content: details || subtitle,
            details: details || subtitle,
            tags: [
                ...extractedTags,
                ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
            ],
            manualConnections: extractedLinks.length > 0 ? extractedLinks : undefined,
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

export const parseCsvFormat = (csvString: string, defaultCardType: CardType, groupName: string): Card[] => {
    // We will auto-detect the delimiter with PapaParse
    const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error(`Erreur CSV: ${parsed.errors[0].message}`);
    }

    // In case no header matches typical names, we fallback to array mode if needed, but header:true is best for CSV/TSV from Anki/Excel
    const validCards: Card[] = [];

    parsed.data.forEach((row: any, index) => {
        // Try to identify Title, Content, Tags from columns
        // Common Anki exports or simple Excel headers: Title, Name, Front, Recto / Content, Description, Back, Verso / Tags
        const title = pickString(row.title, row.titre, row.name, row.nom, row.front, row.recto, row['col 1'], row.concept);
        if (!title) return; // skip row if no title
        
        const content = pickString(row.content, row.contenu, row.description, row.back, row.verso, row.details, row['col 2'], row.définition);
        const tagsRaw = pickString(row.tags, row.tag, row.étiquettes, row.categories);
        
        const tags = tagsRaw ? tagsRaw.split(',').map(t => sanitizeText(t)).filter(Boolean) : [];
        const subject = pickString(row.subject, row.matiere, row.matière, row.module, row.course, row.cours);

        validCards.push({
            id: generateSafeId(title) + '-' + index, // Add index to avoid ID collision if same title
            type: defaultCardType,
            title: sanitizeText(title),
            subtitle: '',
            content: sanitizeText(content),
            details: sanitizeText(content),
            tags: [
                ...tags,
                ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
            ],
            subject: subject ? sanitizeText(subject) : undefined,
        } as Card);
    });

    if (validCards.length === 0 && parsed.data.length > 0) {
        // If we have rows but no valid cards, it might be a headerless CSV
        // Let's parse without header
        const fallbackParsed = Papa.parse(csvString, { header: false, skipEmptyLines: true });
        fallbackParsed.data.forEach((row: any, index) => {
            if (!Array.isArray(row) || row.length === 0) return;
            const title = pickString(row[0]);
            if (!title) return;
            
            const content = row.length > 1 ? pickString(row[1]) : '';
            const tags = row.length > 2 ? pickString(row[2]).split(',').map(t => sanitizeText(t)).filter(Boolean) : [];
            
            validCards.push({
                id: generateSafeId(title) + '-' + index,
                type: defaultCardType,
                title: sanitizeText(title),
                subtitle: '',
                content: sanitizeText(content),
                details: sanitizeText(content),
                tags: [
                    ...tags,
                    ...(groupName.trim() ? [`_group:${groupName.trim()}`] : [])
                ]
            } as Card);
        });
    }

    return validCards;
};
