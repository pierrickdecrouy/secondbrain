import React, { useState } from 'react';
import { ArrowLeft, FileText, UploadSimple, Stack, X } from '@phosphor-icons/react';
import { CardFormContent } from './CardForm';
import { BatchImportContent } from './BatchImportModal';
import type { Card } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AddDataModalProps {
    mode: 'create' | 'edit' | 'import';
    card?: Card | null;
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
    onClose: () => void;
    onPause?: (draftCard: Partial<Card>) => void;
    layout?: 'modal' | 'drawer';
}

export const AddDataModal: React.FC<AddDataModalProps> = ({ mode = 'create', card, existingCards = [], onSave, onImport, onClose, onPause, layout = 'modal' }) => {
    const isEditMode = mode === 'edit' && !!card;
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>(mode === 'import' ? 'batch' : 'single');

    const modalRef = useFocusTrap(true);

    if (layout === 'drawer') {
        // Drawer layout remains similar but styled
        return (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-md transition-opacity" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div 
                    ref={modalRef}
                    className="h-full w-full max-w-2xl bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300"
                >
                    {activeTab as string === 'batch' && (
                        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900">
                            <h2 className="text-slate-900 dark:text-slate-100 font-semibold text-sm m-0">
                                {isEditMode ? 'Modifier la fiche' : 'Ajouter des données'}
                            </h2>
                            <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                        {activeTab as string === 'single' ? (
                            <CardFormContent 
                                card={card} 
                                existingCards={existingCards} 
                                onSave={async (c) => { await onSave(c); onClose(); }} 
                                onCancel={onClose} 
                                onPause={onPause} 
                            />
                        ) : (
                            <div className="p-6 w-full h-full">
                                <BatchImportContent onImport={onImport} onClose={onClose} existingCards={existingCards} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Modal Layout (Mockup implementation)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 transition-opacity" onClick={(e) => e.target === e.currentTarget && onClose()}>
            
            {/* Modal Window Container */}
            <div 
                ref={modalRef}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-[1400px] h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn"
            >
                
                {/* --- TOP NAVIGATION BAR (For Batch Mode Only) --- */}
                {activeTab as string === 'batch' && (
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900">
                        
                        {/* Left: Back & Title */}
                        <div className="flex items-center gap-4 w-1/3">
                            <button 
                                onClick={onClose}
                                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border-none cursor-pointer bg-transparent"
                            >
                                <ArrowLeft weight="bold" /> Retour
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                                <span className="text-emerald-500 flex items-center"><FileText weight="duotone" /></span>
                                {isEditMode ? 'Modifier la fiche' : 'Nouvelle fiche'}
                            </div>
                        </div>

                        {/* Center: Mode Toggle (Segmented Control) */}
                        {!isEditMode && (
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('single')}
                                    className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${
                                        activeTab as string === 'single' 
                                            ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold' 
                                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 font-medium'
                                    }`}
                                >
                                    <FileText weight={activeTab as string === 'single' ? "bold" : "regular"} /> Nouvelle Carte
                                </button>
                                <button
                                    onClick={() => setActiveTab('batch')}
                                    className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${
                                        activeTab as string === 'batch' 
                                            ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-500 font-semibold' 
                                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 font-medium'
                                    }`}
                                >
                                    <UploadSimple weight={activeTab as string === 'batch' ? "bold" : "regular"} /> Import en masse
                                </button>
                            </div>
                        )}

                        {/* Right: Stats/Info */}
                        <div className="flex items-center justify-end w-1/3">
                            <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Stack weight="duotone" /> {existingCards.length} fiches
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative flex bg-slate-50 dark:bg-slate-950">
                    
                    {/* SINGLE CARD EDITOR MODE */}
                    {activeTab as string === 'single' && (
                        <div className="flex-1 flex flex-col w-full h-full">
                            <CardFormContent
                                card={card}
                                existingCards={existingCards}
                                onSave={async (c) => {
                                    await onSave(c);
                                    onClose();
                                }}
                                onCancel={onClose}
                                onPause={onPause}
                                headerCenterContent={!isEditMode && (
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto">
                                        <button
                                            onClick={() => setActiveTab('single')}
                                            className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${activeTab as string === 'single' ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}
                                        >
                                            <FileText weight={activeTab as string === 'single' ? "bold" : "regular"} /> Nouvelle Carte
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('batch')}
                                            className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${activeTab as string === 'batch' ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}
                                        >
                                            <UploadSimple weight={activeTab as string === 'batch' ? "bold" : "regular"} /> Import en masse
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    )}

                    {/* BULK IMPORT EDITOR MODE */}
                    {activeTab as string === 'batch' && (
                        <div className="flex-1 flex flex-col w-full h-full p-4 sm:p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto w-full">
                                <BatchImportContent
                                    onImport={onImport}
                                    onClose={onClose}
                                    existingCards={existingCards}
                                />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
