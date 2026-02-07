import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    return (
        <div className={`prose prose-sm max-w-none text-slate-700 ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
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
