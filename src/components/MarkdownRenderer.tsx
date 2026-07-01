import React from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { InteractiveCardLink } from './ui/InteractiveCardLink';

interface MarkdownRendererProps {
    content: string;
    className?: string;
    onInternalLinkClick?: (target: string) => void;
}

// Helper to process children for Cloze Deletion (||text||)
const renderWithCloze = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
        if (typeof child === 'string') {
            const parts = child.split(/\|\|(.*?)\|\|/g);
            if (parts.length === 1) return child; // No matches

            return parts.map((part, index) => {
                // Even indices are normal text, odd are cloze
                if (index % 2 === 1) {
                    return <span key={index} className="cloze-spoiler">{part}</span>;
                }
                return part;
            });
        }
        return child;
    });
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', onInternalLinkClick }) => {
    // Pre-process content to handle custom line breaks using '\'
    // We replace '\' that is NOT preceded by '\' (to avoid \\) and NOT followed by a non-whitespace (to protect \frac, etc.)
    // with '  \n' which ensures a hard break in Markdown.
    const processedContent = React.useMemo(() => {
        if (!content) return '';
        // Sanitize the raw content first (prevent XSS before processing)
        let processed = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'mark', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
        });
        
        // Handle custom line breaks using '\'
        processed = processed.replace(/(?<!\\)\\(?=\s|$)/g, '  \n');
        // Handle highlight syntax: ==text== -> <mark>text</mark>
        processed = processed.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        // Handle wiki links: [[text]] -> <a href="#internal:text" class="wiki-link">text</a>
        processed = processed.replace(/\[\[(.*?)\]\]/g, '<a href="#internal:$1" class="wiki-link">$1</a>');
        return processed;
    }, [content]);

    return (
        <div className={`prose dark:prose-invert prose-indigo max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                    rehypeRaw, 
                    [rehypeSanitize, {
                        ...defaultSchema,
                        attributes: {
                            ...defaultSchema.attributes,
                            // Ensure class names and specific attributes are kept
                            '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
                            a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
                            // Support for mark tags
                            mark: ['className'],
                        },
                        // Explicitly deny scripts and event handlers (already default, but good practice to assert)
                        tagNames: defaultSchema.tagNames?.filter(t => t !== 'script' && t !== 'style' && t !== 'iframe'),
                    }], 
                    rehypeKatex
                ]}
                components={{
                    // Cloze Deletion Support
                    p: ({ node, children, ...props }) => (
                        <p {...props}>{renderWithCloze(children)}</p>
                    ),
                    li: ({ node, children, ...props }) => (
                        <li {...props}>{renderWithCloze(children)}</li>
                    ),
                    
                    // Style mark tags (highlights)
                    mark: ({ node, ...props }) => (
                        <mark {...props} className="bg-yellow-200/60 dark:bg-yellow-500/30 text-inherit px-1 rounded-sm" />
                    ),
                    // Customize link rendering
                    a: ({ node, href, ...props }) => {
                        if (href?.startsWith('#internal:')) {
                            const target = decodeURIComponent(href.replace('#internal:', ''));
                            return (
                                <InteractiveCardLink 
                                    target={target}
                                    onClick={onInternalLinkClick}
                                >
                                    {props.children}
                                </InteractiveCardLink>
                            );
                        }
                        return <a {...props} href={href} target="_blank" rel="noopener noreferrer" />;
                    },
                    // Style blockquotes and alerts
                    blockquote: ({ node, children, ...props }) => {
                        // Check for GitHub-style alerts
                        const firstChild = React.Children.toArray(children)[0];

                        // Check if first child is an element and has children
                        if (React.isValidElement(firstChild)) {
                            const element = firstChild as React.ReactElement<{ children?: React.ReactNode }>;
                            if (element.props.children) {
                                const text = String(Array.isArray(element.props.children)
                                    ? (element.props.children as any[])[0]
                                    : element.props.children || '');

                                if (text.startsWith('[!NOTE]')) {
                                    return (
                                        <div className="not-prose my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg text-blue-900 dark:text-blue-100">
                                            <div className="font-semibold mb-1 text-blue-700 dark:text-blue-400 flex items-center gap-2">ℹ️ Note</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!TIP]')) {
                                    return (
                                        <div className="not-prose my-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg text-green-900 dark:text-green-100">
                                            <div className="font-semibold mb-1 text-green-700 dark:text-green-400 flex items-center gap-2">💡 Astuce</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!IMPORTANT]')) {
                                    return (
                                        <div className="not-prose my-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-r-lg text-purple-900 dark:text-purple-100">
                                            <div className="font-semibold mb-1 text-purple-700 dark:text-purple-400 flex items-center gap-2">📢 Important</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!WARNING]')) {
                                    return (
                                        <div className="not-prose my-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg text-amber-900 dark:text-amber-100">
                                            <div className="font-semibold mb-1 text-amber-700 dark:text-amber-400 flex items-center gap-2">⚠️ Attention</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!CAUTION]')) {
                                    return (
                                        <div className="not-prose my-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg text-red-900 dark:text-red-100">
                                            <div className="font-semibold mb-1 text-red-700 dark:text-red-400 flex items-center gap-2">🛑 Danger</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                            }
                        }

                        // Default blockquote handled by prose
                        return (
                            <blockquote {...props}>
                                {children}
                            </blockquote>
                        );
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

