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
        <div className="add-data-segmented-control">
            <button onClick={() => setMode("course")} className={`segmented-btn ${mode === "course" ? "active-emerald" : ""}`}>
                <BookOpen size={16} weight={mode === "course" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouveau</span> Cours
            </button>
            <button onClick={() => setMode("concept")} className={`segmented-btn ${mode === "concept" ? "active-amber" : ""}`}>
                <FileText size={16} weight={mode === "concept" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouveau</span> Concept
            </button>
            <button onClick={() => setMode("flashcard")} className={`segmented-btn ${mode === "flashcard" ? "active-blue" : ""}`}>
                <Cards size={16} weight={mode === "flashcard" ? "fill" : "bold"} /> <span className="hidden sm:inline">Nouvelle</span> Flashcard
            </button>
            <div className="w-px h-4 bg-[color:var(--color-border)] mx-1"></div>
            <button onClick={() => setMode("batch")} className={`segmented-btn ${mode === "batch" ? "active-indigo" : ""}`}>
                <UploadSimple size={16} weight={mode === "batch" ? "fill" : "bold"} /> Import Massif
            </button>
        </div>
    );

    if (mode === "batch") {
        return (
            <div className="flex flex-col h-screen w-full bg-[color:var(--color-bg)] font-sans text-[color:var(--color-text)] overflow-hidden relative">
                <div className="h-16 bg-[color:var(--color-bg)] border-b border-[color:var(--color-border)] flex items-center justify-between px-6 lg:px-12 shrink-0 z-20">
                    <button onClick={handleBack} className="flex items-center gap-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)] px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border-none outline-none cursor-pointer bg-transparent">
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
