import React, { useState } from 'react';
import {
    ArrowLeft,
    FilePlus,
    UploadSimple,
    Sparkle,
} from '@phosphor-icons/react';
import { CardFormContent } from './CardForm';
import { BatchImportContent } from './BatchImportModal';
import type { Card } from '../types';
import { useNavigate } from 'react-router-dom';

interface AddDataPageProps {
    existingCards?: Card[];
    onSave: (card: Card) => void;
    onImport: (cards: Card[]) => void;
}

type Mode = 'single' | 'batch';

export const AddDataPage: React.FC<AddDataPageProps> = ({
    existingCards = [],
    onSave,
    onImport,
}) => {
    const [mode, setMode] = useState<Mode>('single');
    const navigate = useNavigate();

    const handleBack = () => navigate(-1);

    const handleSave = async (card: Card) => {
        await onSave(card);
        handleBack();
    };

    return (
        <div
            className="flex flex-col w-full h-full overflow-hidden"
            style={{
                backgroundColor: 'var(--color-bg)',
                backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }}
        >
            {/* ── Top bar ────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-4 px-8 py-4 border-b border-[color:var(--color-border)] shrink-0"
                style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(8px)' }}
            >
                {/* Back */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 bg-transparent border border-[color:var(--color-border)] rounded-xl cursor-pointer text-[color:var(--color-text-muted)] text-[0.82rem] font-medium py-2 px-3.5 transition-all duration-150 hover:text-[color:var(--color-text)] hover:border-[color:var(--color-text-muted)]"
                >
                    <ArrowLeft size={14} />
                    Retour
                </button>

                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Sparkle size={16} weight="fill" color="#fff" />
                    </div>
                    <span className="text-[1rem] font-bold text-[color:var(--color-text)]">
                        Nouvelle fiche
                    </span>
                </div>

                {/* Mode toggle */}
                <div className="flex bg-[color:var(--color-bg)] rounded-xl p-1 border border-[color:var(--color-border)] ml-2 gap-1">
                    {([
                        { id: 'single' as Mode, icon: <FilePlus size={14} weight="bold" />, label: 'Nouvelle Carte', color: '#0d9488' },
                        { id: 'batch' as Mode, icon: <UploadSimple size={14} weight="bold" />, label: 'Import en masse', color: '#8b5cf6' },
                    ]).map(m => {
                        const isActive = mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`flex items-center gap-1.5 py-2 px-4 rounded-[9px] border-none cursor-pointer text-[0.8rem] transition-all duration-150 ${isActive ? 'font-bold' : 'font-medium'}`}
                                style={{
                                    color: isActive ? m.color : 'var(--color-text-muted)',
                                    background: isActive ? `${m.color}18` : 'transparent',
                                }}
                            >
                                <span style={{ color: isActive ? m.color : 'var(--color-text-muted)' }}>{m.icon}</span>
                                {m.label}
                            </button>
                        );
                    })}
                </div>

                <div className="ml-auto">
                    <span className="text-xs text-[color:var(--color-text-muted)] py-1.5 px-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] font-medium">
                        {existingCards.length} fiches
                    </span>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {mode === 'single' ? (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <CardFormContent
                            existingCards={existingCards}
                            onSave={handleSave}
                            onCancel={handleBack}
                            hideCourseOption={true}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <BatchImportContent
                            onImport={(importedCards) => {
                                onImport(importedCards);
                                handleBack();
                            }}
                            existingCards={existingCards}
                            onClose={handleBack}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

