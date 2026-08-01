import React, { useState } from "react";
import { ArrowLeft, BookOpen, Cards, UploadSimple, FileText } from "@phosphor-icons/react";
import { CardFormContent } from "./CardForm";
import { BatchImportContent } from "./BatchImportModal";
import type { Card } from "../types";
import { useNavigate } from "react-router-dom";

interface AddDataPageProps {
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
}

type Mode = "course" | "concept" | "flashcard" | "batch";

export const AddDataPage: React.FC<AddDataPageProps> = ({ existingCards = [], onSave, onImport }) => {
    const [mode, setMode] = useState<Mode>("course");
    const navigate = useNavigate();
    const handleBack = () => navigate(-1);
    const handleSave = async (card: Card) => { await onSave(card); handleBack(); };

    const tabsNode = (
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto">
            <button onClick={() => setMode("course")} className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${mode === "course" ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}>
                <BookOpen size={16} weight={mode === "course" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouveau</span> Cours
            </button>
            <button onClick={() => setMode("concept")} className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${mode === "concept" ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}>
                <FileText size={16} weight={mode === "concept" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouveau</span> Concept
            </button>
            <button onClick={() => setMode("flashcard")} className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${mode === "flashcard" ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}>
                <Cards size={16} weight={mode === "flashcard" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouvelle</span> Flashcard
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button onClick={() => setMode("batch")} className={`flex items-center gap-2 py-1.5 px-4 text-sm rounded-lg transition-all border-none outline-none cursor-pointer ${mode === "batch" ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-500 font-semibold shadow-sm" : "bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100"}`}>
                <UploadSimple size={16} weight={mode === "batch" ? "fill" : "bold"} /> Import Massif
            </button>
        </div>
    );

    if (mode === "batch") {
        return (
            <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative">
                <div className="h-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-12 shrink-0 z-20">
                    <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border-none outline-none cursor-pointer bg-transparent">
                        <ArrowLeft size={18} weight="bold" />
                        Retour au deck
                    </button>
                    
                    <div className="hidden md:flex flex-1 justify-center">
                        {tabsNode}
                    </div>

                    <div className="flex items-center gap-4 opacity-0 pointer-events-none">
                        <button className="btn-primary">Placeholder</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative pb-32">
                    <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col h-full min-h-[500px]">
                        <BatchImportContent onImport={(c) => { onImport(c); handleBack(); }} existingCards={existingCards} onClose={handleBack} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-hidden">
            <CardFormContent 
                existingCards={existingCards} 
                onSave={handleSave} 
                onCancel={handleBack} 
                initialNodeType={mode} 
                headerCenterContent={tabsNode}
            />
        </div>
    );
};
