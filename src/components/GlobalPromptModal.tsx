import React, { useState, useEffect, useRef } from 'react';
import { usePromptStore } from '../store/usePromptStore';
import { X } from '@phosphor-icons/react';

export const GlobalPromptModal = () => {
    const { isOpen, title, defaultValue, closePrompt } = usePromptStore();
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, defaultValue]);
    
    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        closePrompt(value);
    };
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button 
                        type="button" 
                        onClick={() => closePrompt(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer outline-none"
                    >
                        <X size={16} weight="bold" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white mb-5 transition-colors"
                    />
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => closePrompt(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border-none outline-none cursor-pointer bg-transparent">
                            Annuler
                        </button>
                        <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors border-none outline-none cursor-pointer">
                            Valider
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
