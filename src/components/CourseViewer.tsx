import React from 'react';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeft, PencilSimple, Printer, Trash } from '@phosphor-icons/react';

interface CourseViewerProps {
    course: Card;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
    course,
    onBack,
    onEdit,
    onDelete
}) => {
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden print:bg-white print:block print:h-auto print:overflow-visible">
            {/* Header / Nav */}
            <div className="flex items-center justify-between px-8 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 print:hidden">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold transition-colors"
                >
                    <ArrowLeft size={20} />
                    Retour
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                    >
                        <Printer size={16} weight="bold" />
                        <span>Exporter en PDF</span>
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800/30 rounded-lg text-[14px] font-medium transition-colors shadow-sm"
                    >
                        <Trash size={16} weight="bold" />
                        <span>Supprimer</span>
                    </button>
                    <button 
                        onClick={onEdit} 
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-[14px] font-medium transition-colors shadow-sm active:scale-95"
                    >
                        <PencilSimple size={16} weight="bold" />
                        <span>Modifier</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex justify-center print:overflow-visible print:p-0 print:block">
                {/* Print area container */}
                <div className="w-full max-w-[1000px] bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-slate-800 dark:text-slate-200 print:shadow-none print:rounded-none print:p-0 print:max-w-none print:text-black">
                    
                    {/* Meta */}
                    <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold m-0 mb-4 leading-tight text-slate-900 dark:text-white print:text-black">{course.title}</h1>
                        {course.tags && course.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {course.tags.map(t => (
                                    <span key={t} className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            Dernière mise à jour: {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-lg leading-relaxed print:text-black">
                        <MarkdownRenderer content={course.details || course.content || ''} />
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 1.5cm; }
                    body { background: white !important; }
                    
                    /* Typography for print */
                    .prose, .prose * { color: black !important; }
                    h1, h2, h3, h4 { page-break-after: avoid; }
                    p, img, table { page-break-inside: avoid; }
                    img { max-width: 100% !important; }
                    
                    /* Medical alerts in print */
                    .medical-alert { border: 1px solid #ccc !important; box-shadow: none !important; break-inside: avoid; }
                    .medical-alert-header { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />
        </div>
    );
};
