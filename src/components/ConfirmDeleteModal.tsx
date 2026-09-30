import React from 'react';
import { Warning } from '@phosphor-icons/react';
import { safeHtml } from '../utils/sanitize';

import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDeleteModalProps {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    heading?: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmClassName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    title,
    onConfirm,
    onCancel,
    heading = 'Supprimer cette fiche ?',
    message,
    confirmLabel = 'Supprimer',
    cancelLabel = 'Annuler',
    confirmClassName = 'btn-danger'
}) => {
    const modalRef = useFocusTrap(true);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" 
            onClick={handleOverlayClick}
        >
            <div 
                ref={modalRef} 
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all"
            >
                <div className="flex items-center gap-3 text-red-500">
                    <Warning size={32} weight="duotone" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">{heading}</h3>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {message ?? (
                        <span>La fiche "<strong className="font-semibold text-slate-800 dark:text-slate-100" dangerouslySetInnerHTML={safeHtml(title || '')} />" sera définitivement supprimée.</span>
                    )}
                </p>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        className="py-2.5 px-6 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:shadow-md" 
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        className={`py-2.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 ${confirmClassName === 'btn-danger' ? 'bg-red-600 hover:bg-red-500 border border-red-500/50 shadow-red-500/20' : confirmClassName}`} 
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
