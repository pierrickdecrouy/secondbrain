import React, { useState, useEffect } from 'react';
import { X, Brain } from '@phosphor-icons/react';
import { usePomodoroStore } from '../store/usePomodoroStore';

export const PomodoroModal: React.FC = () => {
    const { showModal, closeModal, settings, updateSettings } = usePomodoroStore();
    
    // Local state for the inputs
    const [localFocus, setLocalFocus] = useState(settings.focus);
    const [localShort, setLocalShort] = useState(settings.shortBreak);
    const [localLong, setLocalLong] = useState(settings.longBreak);

    // Sync local state when modal opens
    useEffect(() => {
        if (showModal) {
            setLocalFocus(settings.focus);
            setLocalShort(settings.shortBreak);
            setLocalLong(settings.longBreak);
        }
    }, [showModal, settings]);

    if (!showModal) return null;

    const handleSave = () => {
        updateSettings({
            focus: localFocus,
            shortBreak: localShort,
            longBreak: localLong
        });
        closeModal();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-indigo-900/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-[16px]">
                            <Brain size={24} weight="duotone" />
                        </div>
                        <h3 className="font-bold text-[22px] text-slate-900 dark:text-white tracking-tight">Paramètres</h3>
                    </div>
                    <button 
                        onClick={closeModal}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-full"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                <div className="px-8 py-2 space-y-6">
                    {/* Focus Time */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-[24px] space-y-4 border border-slate-100/80 dark:border-slate-800/80">
                        <div className="flex justify-between items-center">
                            <label className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">Durée Focus</label>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm px-3 py-1.5 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                                {localFocus} min
                            </span>
                        </div>
                        <input 
                            type="range" min="15" max="60" value={localFocus} 
                            onChange={(e) => setLocalFocus(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all" 
                        />
                    </div>

                    {/* Short Break */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-[24px] space-y-4 border border-slate-100/80 dark:border-slate-800/80">
                        <div className="flex justify-between items-center">
                            <label className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">Pause Courte</label>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm px-3 py-1.5 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                                {localShort} min
                            </span>
                        </div>
                        <input 
                            type="range" min="2" max="15" value={localShort} 
                            onChange={(e) => setLocalShort(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all" 
                        />
                    </div>

                    {/* Long Break */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-[24px] space-y-4 border border-slate-100/80 dark:border-slate-800/80">
                        <div className="flex justify-between items-center">
                            <label className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">Pause Longue</label>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm px-3 py-1.5 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                                {localLong} min
                            </span>
                        </div>
                        <input 
                            type="range" min="10" max="30" value={localLong} 
                            onChange={(e) => setLocalLong(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all" 
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pt-6 pb-8 flex gap-4 mt-2">
                    <button 
                        onClick={closeModal}
                        className="flex-1 px-4 py-3.5 text-[15px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-[16px] transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 px-4 py-3.5 text-[15px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[16px] transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                    >
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
};
