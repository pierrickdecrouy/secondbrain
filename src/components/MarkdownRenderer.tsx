import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

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
        let processed = content.replace(/(?<!\\)\\(?=\s|$)/g, '  \n');
        // Handle highlight syntax: ==text== -> <mark>text</mark>
        processed = processed.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        // Handle wiki links: [[text]] -> <a href="#internal:text" class="wiki-link">text</a>
        processed = processed.replace(/\[\[(.*?)\]\]/g, '<a href="#internal:$1" class="wiki-link">$1</a>');
        return processed;
    }, [content]);

    return (
        <div className={`prose max-w-none text-slate-700 dark:text-slate-300 ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    // Cloze Deletion Support
                    p: ({ node, children, ...props }) => (
                        <p {...props} className="mb-5 leading-relaxed">{renderWithCloze(children)}</p>
                    ),
                    ul: ({ node, children, ...props }) => (
                        <ul {...props} className="list-disc pl-5 mb-6 space-y-1.5 marker:text-slate-400">{children}</ul>
                    ),
                    ol: ({ node, children, ...props }) => (
                        <ol {...props} className="list-decimal pl-5 mb-6 space-y-1.5 marker:text-slate-400">{children}</ol>
                    ),
                    li: ({ node, children, ...props }) => (
                        <li {...props} className="pl-1 leading-relaxed">{renderWithCloze(children)}</li>
                    ),
                    hr: ({ node, ...props }) => (
                        <hr {...props} className="my-8 border-t border-slate-200 dark:border-slate-700" />
                    ),
                    h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-6 pb-2 border-b border-slate-200 dark:border-slate-700" />,
                    h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-10 mb-4 tracking-tight" />,
                    h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-8 mb-3" />,
                    strong: ({ node, ...props }) => <strong {...props} className="font-semibold text-slate-800 dark:text-slate-200" />,

                    // Style mark tags (highlights)
                    mark: ({ node, ...props }) => (
                        <mark {...props} className="bg-yellow-200/60 dark:bg-yellow-500/30 text-inherit px-1 rounded-sm" />
                    ),
                    // Customize link rendering
                    a: ({ node, href, ...props }) => {
                        if (href?.startsWith('#internal:')) {
                            const target = decodeURIComponent(href.replace('#internal:', ''));
                            return (
                                <a 
                                    {...props} 
                                    href={href}
                                    className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-semibold cursor-pointer border-b border-teal-200 dark:border-teal-800 hover:border-teal-600 dark:hover:border-teal-500 transition-colors" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (onInternalLinkClick) onInternalLinkClick(target);
                                    }}
                                >
                                    {props.children}
                                </a>
                            );
                        }
                        return <a {...props} href={href} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer" />;
                    },
                    // Ensure images are responsive
                    img: ({ node, ...props }) => (
                        <img {...props} className="max-w-full h-auto rounded-lg my-6 border border-slate-200 dark:border-slate-700 shadow-sm" loading="lazy" />
                    ),
                    // Style tables
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <table {...props} className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-[0.95rem]" />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead {...props} className="bg-slate-50 dark:bg-slate-800/50" />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody {...props} className="bg-white dark:bg-slate-800/20 divide-y divide-slate-200 dark:divide-slate-700" />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr {...props} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors" />
                    ),
                    th: ({ node, ...props }) => (
                        <th {...props} className="px-6 py-4 text-left text-[0.8rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" />
                    ),
                    td: ({ node, ...props }) => (
                        <td {...props} className="px-6 py-5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed" />
                    ),
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
                                        <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg text-blue-900 dark:text-blue-100">
                                            <div className="font-semibold mb-1 text-blue-700 dark:text-blue-400 flex items-center gap-2">ℹ️ Note</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!TIP]')) {
                                    return (
                                        <div className="my-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg text-green-900 dark:text-green-100">
                                            <div className="font-semibold mb-1 text-green-700 dark:text-green-400 flex items-center gap-2">💡 Astuce</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!IMPORTANT]')) {
                                    return (
                                        <div className="my-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-r-lg text-purple-900 dark:text-purple-100">
                                            <div className="font-semibold mb-1 text-purple-700 dark:text-purple-400 flex items-center gap-2">📢 Important</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!WARNING]')) {
                                    return (
                                        <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg text-amber-900 dark:text-amber-100">
                                            <div className="font-semibold mb-1 text-amber-700 dark:text-amber-400 flex items-center gap-2">⚠️ Attention</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!CAUTION]')) {
                                    return (
                                        <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg text-red-900 dark:text-red-100">
                                            <div className="font-semibold mb-1 text-red-700 dark:text-red-400 flex items-center gap-2">🛑 Danger</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                            }
                        }

                        // Default blockquote
                        return (
                            <blockquote {...props} className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 italic text-slate-600 dark:text-slate-400 my-4 bg-slate-50 dark:bg-slate-800/50 rounded-r">
                                {children}
                            </blockquote>
                        );
                    },
                    code: ({ node, inline, className, children, ...props }: any) => {
                        return inline ? (
                            <code {...props} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-sm border border-slate-200 dark:border-slate-700">
                                {children}
                            </code>
                        ) : (
                            <code {...props} className={className || ""}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ node, ...props }) => (
                        <pre {...props} className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono shadow-md" />
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};
