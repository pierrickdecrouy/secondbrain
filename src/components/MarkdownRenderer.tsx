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
    return (
        <div className={`prose prose-sm max-w-none text-slate-700 ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    // Cloze Deletion Support
                    p: ({ node, children, ...props }) => (
                        <p {...props} className="mb-4">{renderWithCloze(children)}</p>
                    ),
                    li: ({ node, children, ...props }) => (
                        <li {...props} className="mb-2">{renderWithCloze(children)}</li>
                    ),

                    // Customize link rendering if needed
                    a: ({ node, ...props }) => (
                        <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                    ),
                    // Ensure images are responsive
                    img: ({ node, ...props }) => (
                        <img {...props} className="max-w-full h-auto rounded-lg my-4 border border-slate-200" />
                    ),
                    // Style tables
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                            <table {...props} className="min-w-full divide-y divide-gray-300" />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th {...props} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50" />
                    ),
                    td: ({ node, ...props }) => (
                        <td {...props} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 border-t border-gray-200" />
                    ),
                    // Style blockquotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote {...props} className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
