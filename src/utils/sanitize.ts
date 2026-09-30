import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'br', 'span', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];

export const sanitizeHtml = (html: string | undefined | null): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
};

export const safeHtml = (html: string | undefined | null) => ({
    __html: sanitizeHtml(html)
});
