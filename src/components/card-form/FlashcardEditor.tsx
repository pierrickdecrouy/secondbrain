import React from 'react';
import type { Card } from '../../types';
import { CourseEditor } from '../CourseEditor';
import { EyeSlash, ArrowsLeftRight } from '@phosphor-icons/react';

interface FlashcardEditorProps {
    formData: Partial<Card>;
    setFormData: (data: Partial<Card>) => void;
    existingCards: Card[];
}

export const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ formData, setFormData, existingCards }) => {
    return (
        <div className="flex flex-col flex-1 h-full p-6 sm:p-8 gap-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
            {/* Format Selector */}
            <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 m-0">Contenu de la Flashcard</h3>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto">
                    <button
                        onClick={() => setFormData({ ...formData, format: 'q&a' })}
                        className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all duration-200 border-none outline-none cursor-pointer font-medium ${formData.format !== 'cloze' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                    >
                        <ArrowsLeftRight size={16} weight="bold" />
                        Question / Réponse
                    </button>
                    <button
                        onClick={() => setFormData({ ...formData, format: 'cloze' })}
                        className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all duration-200 border-none outline-none cursor-pointer font-medium ${formData.format === 'cloze' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
                    >
                        <EyeSlash size={16} weight="bold" />
                        Texte à trous
                    </button>
                </div>
            </div>

            {formData.format === 'cloze' ? (
                <div className="flex flex-col gap-3 flex-1 min-h-[400px]">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            Texte à trous (Cloze)
                        </label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Utilisez l'outil "Texte à trou" dans la barre d'outils ou entourez avec {'{accolades}'}</span>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner focus-within:border-indigo-500/50 transition-colors p-4">
                        <CourseEditor
                            value={formData.content || ''}
                            onChange={(val) => setFormData({ ...formData, content: val })}
                            existingCards={existingCards}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6 flex-1">
                    {/* Recto / Question */}
                    <div className="flex flex-col gap-3 flex-1 min-h-[200px]">
                        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            Question <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px]">Recto</span>
                        </label>
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner focus-within:border-indigo-500/50 transition-colors p-4">
                            <CourseEditor
                                value={formData.title || ''}
                                onChange={(val) => setFormData({ ...formData, title: val })}
                                existingCards={existingCards}
                            />
                        </div>
                    </div>

                    {/* Verso / Réponse */}
                    <div className="flex flex-col gap-3 flex-1 min-h-[250px]">
                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            Réponse <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Verso</span>
                        </label>
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner focus-within:border-emerald-500/50 transition-colors p-4">
                            <CourseEditor
                                value={formData.details || ''}
                                onChange={(val) => setFormData({ ...formData, details: val })}
                                existingCards={existingCards}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
