import React, { useState } from 'react';
import {
    ArrowLeft,
    FilePlus,
    UploadSimple,
    FloppyDisk,
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
        <div className="adp-root">
            {/* ── Top bar ── */}
            <div className="adp-topbar">
                {/* Left: Back + Title */}
                <div className="adp-topbar-left">
                    <button onClick={handleBack} className="adp-back-btn">
                        <ArrowLeft size={15} weight="bold" />
                        Retour
                    </button>

                    <div className="adp-topbar-divider" />

                    <div className="adp-topbar-title">
                        <FloppyDisk size={16} weight="fill" className="adp-topbar-title-icon" />
                        Nouvelle fiche
                    </div>
                </div>

                {/* Center: Mode toggle */}
                <div className="adp-mode-toggle">
                    {([
                        { id: 'single' as Mode, icon: <FilePlus size={14} weight="bold" />, label: 'Nouvelle Carte' },
                        { id: 'batch' as Mode, icon: <UploadSimple size={14} weight="bold" />, label: 'Import en masse' },
                    ]).map(m => {
                        const isActive = mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`adp-mode-btn${isActive ? ' active' : ''}`}
                            >
                                {m.icon}
                                {m.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right: count badge */}
                <div className="adp-topbar-right">
                    <span className="adp-count-badge">
                        {existingCards.length} fiches
                    </span>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="adp-content">
                {mode === 'single' ? (
                    <div className="adp-single-wrapper">
                        <CardFormContent
                            existingCards={existingCards}
                            onSave={handleSave}
                            onCancel={handleBack}
                            hideCourseOption={true}
                        />
                    </div>
                ) : (
                    <div className="adp-batch-wrapper">
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
