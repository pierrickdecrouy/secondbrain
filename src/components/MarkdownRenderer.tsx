import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
    content: string;
    className?: string;
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
        // Recursion for nested elements (e.g. bold/italic inside)
        // Be careful with recursion depth, but typically markdown structure is shallow
        // Also simple recursion on React Nodes can be tricky if they are not simple elements.
        // For safety, let's only process strings at the top level of P and LI for now to avoid breaking complex structures.
        return child;
    });
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    // Pre-process content to handle custom line breaks using '\'
    // We replace '\' that is NOT preceded by '\' (to avoid \\) and NOT followed by a non-whitespace (to protect \frac, etc.)
    // with '  \n' which ensures a hard break in Markdown.
    const processedContent = React.useMemo(() => {
        if (!content) return '';
        let processed = content.replace(/(?<!\\)\\(?=\s|$)/g, '  \n');
        // Handle highlight syntax: ==text== -> <mark>text</mark>
        processed = processed.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        return processed;
    }, [content]);

    return (
        <div className={`prose prose-sm max-w-none text-slate-700 ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    // Cloze Deletion Support
                    p: ({ node, children, ...props }) => (
                        <p {...props} className="mb-4 leading-relaxed">{renderWithCloze(children)}</p>
                    ),
                    li: ({ node, children, ...props }) => (
                        <li {...props} className="mb-2 ml-4 list-disc">{renderWithCloze(children)}</li>
                    ),
                    ul: ({ node, children, ...props }) => (
                        <ul {...props} className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
                    ),
                    ol: ({ node, children, ...props }) => (
                        <ol {...props} className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
                    ),
                    h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-200" />,
                    h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-semibold text-slate-800 mt-5 mb-3" />,
                    h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-semibold text-slate-800 mt-4 mb-2" />,

                    // Style mark tags (highlights)
                    mark: ({ node, ...props }) => (
                        <mark {...props} className="bg-yellow-200/60 dark:bg-yellow-500/30 text-inherit px-1 rounded-sm" />
                    ),
                    // Customize link rendering if needed
                    a: ({ node, ...props }) => (
                        <a {...props} className="text-blue-600 hover:text-blue-800 underline transition-colors" target="_blank" rel="noopener noreferrer" />
                    ),
                    // Ensure images are responsive
                    img: ({ node, ...props }) => (
                        <img {...props} className="max-w-full h-auto rounded-lg my-4 border border-slate-200 shadow-sm" loading="lazy" />
                    ),
                    // Style tables
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table {...props} className="min-w-full divide-y divide-slate-200" />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead {...props} className="bg-slate-50" />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody {...props} className="bg-white divide-y divide-slate-200" />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr {...props} className="hover:bg-slate-50 transition-colors" />
                    ),
                    th: ({ node, ...props }) => (
                        <th {...props} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" />
                    ),
                    td: ({ node, ...props }) => (
                        <td {...props} className="px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap" />
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
                                        <div className="my-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-blue-900">
                                            <div className="font-semibold mb-1 text-blue-700 flex items-center gap-2">ℹ️ Note</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!TIP]')) {
                                    return (
                                        <div className="my-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-900">
                                            <div className="font-semibold mb-1 text-green-700 flex items-center gap-2">💡 Astuce</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!IMPORTANT]')) {
                                    return (
                                        <div className="my-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg text-purple-900">
                                            <div className="font-semibold mb-1 text-purple-700 flex items-center gap-2">📢 Important</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!WARNING]')) {
                                    return (
                                        <div className="my-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-amber-900">
                                            <div className="font-semibold mb-1 text-amber-700 flex items-center gap-2">⚠️ Attention</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                                if (text.startsWith('[!CAUTION]')) {
                                    return (
                                        <div className="my-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-900">
                                            <div className="font-semibold mb-1 text-red-700 flex items-center gap-2">🛑 Danger</div>
                                            <div className="text-sm opacity-90">{children}</div>
                                        </div>
                                    );
                                }
                            }
                        }

                        // Default blockquote
                        return (
                            <blockquote {...props} className="border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600 my-4 bg-slate-50 rounded-r">
                                {children}
                            </blockquote>
                        );
                    },
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return isInline ? (
                            <code {...props} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-sm border border-slate-200">
                                {children}
                            </code>
                        ) : (
                            <code {...props} className={className}>
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
