import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkle, MagicWand, FileText } from '@phosphor-icons/react';
import type { Card } from '../types';
import { CourseCreateForm } from './CourseCreateForm';

interface CourseWizardProps {
    isOpen: boolean;
    onClose: () => void;
    existingCards: Card[];
    onSaveCourse: (card: Card) => void;
}

type WizardMode = 'selection' | 'classic' | 'ai';

export const CourseWizard: React.FC<CourseWizardProps> = ({
    isOpen,
    onClose,
    existingCards,
    onSaveCourse
}) => {
    const [mode, setMode] = useState<WizardMode>('selection');

    // Reset mode when opened
    React.useEffect(() => {
        if (isOpen) setMode('selection');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <motion.div 
                    className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-[24px] border border-white/10 shadow-2xl flex flex-col"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white m-0">Nouveau Cours</h2>
                                <p className="text-sm text-slate-400 m-0">Créez ou générez de nouveaux contenus</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border-none cursor-pointer"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto">
                        {mode === 'selection' && (
                            <div className="p-8 flex flex-col gap-6">
                                <h3 className="text-xl font-bold text-center text-white mb-4">Comment souhaitez-vous créer ce cours ?</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Classic Option */}
                                    <button 
                                        onClick={() => setMode('classic')}
                                        className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText size={32} weight="duotone" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white m-0 mb-2">Création Classique</h4>
                                        <p className="text-sm text-slate-400 m-0">Définissez le titre, les tags, et rédigez manuellement le contenu et les concepts de votre cours.</p>
                                    </button>

                                    {/* AI Option */}
                                    <button 
                                        onClick={() => setMode('ai')}
                                        className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b from-indigo-500/10 to-transparent hover:from-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <MagicWand size={32} weight="duotone" />
                                        </div>
                                        <h4 className="relative text-lg font-bold text-white m-0 mb-2">Génération IA en Masse</h4>
                                        <p className="relative text-sm text-slate-400 m-0">Collez un long texte ou des notes. L'IA générera automatiquement le plan, les concepts et les flashcards.</p>
                                        <div className="absolute top-4 right-4 px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                            Bêta
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'classic' && (
                            <div className="p-0">
                                <CourseCreateForm 
                                    existingCards={existingCards} 
                                    onSave={(card) => {
                                        onSaveCourse(card);
                                        onClose();
                                    }} 
                                    onCancel={() => setMode('selection')} 
                                />
                            </div>
                        )}

                        {mode === 'ai' && (
                            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <MagicWand size={48} className="text-indigo-400 mb-4" weight="duotone" />
                                <h3 className="text-xl font-bold text-white mb-2">Bientôt disponible</h3>
                                <p className="text-slate-400 max-w-md">
                                    L'intégration avec le modèle IA local ou l'API externe est en cours de développement. Vous pourrez bientôt coller vos cours complets ici !
                                </p>
                                <button 
                                    onClick={() => setMode('selection')}
                                    className="mt-6 px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 cursor-pointer"
                                >
                                    Retour
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
