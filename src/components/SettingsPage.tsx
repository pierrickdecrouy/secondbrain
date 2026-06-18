import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { KnowledgeHealthWidget } from './KnowledgeHealthWidget';
import { useCards } from '../context/CardContext';
import { useUI } from '../context/UIContext';

import {
    SettingsSidebar,
    DictionaryTab,
    AppearanceTab,
    DataTab,
    IntelligenceTab,
    RevisionTab
} from './settings';
import type { SettingsTab } from './settings';

interface SettingsPageProps {
    onClose?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose: customOnClose }) => {
    const navigate = useNavigate();
    const { cards } = useCards();
    const { setActiveFilters } = useUI();
    const onClose = () => {
        if (customOnClose) customOnClose();
        else navigate(-1);
    };
    
    const [activeTab, setActiveTab] = useState<SettingsTab>('dictionary');

    // Gestion du clic à l'extérieur pour fermer
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100]"
            onClick={handleOverlayClick}
        >
            <div className="bg-[var(--color-surface)] w-[90vw] max-w-[1000px] h-[85vh] max-h-[800px] rounded-3xl border border-[var(--color-border)] shadow-[0_24px_60px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden relative font-sans text-[var(--color-text)]">
                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col relative bg-[var(--color-bg)] overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center py-5 px-5 md:px-10 border-b border-[var(--color-border)] bg-[var(--color-surface)] z-10">
                        <h2 className="m-0 text-xl text-[var(--color-text)]">Paramètres</h2>
                        <button className="bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] p-2 rounded-full transition-all duration-200 flex items-center justify-center hover:bg-[var(--color-border)] hover:text-[var(--color-text)]" onClick={onClose} title="Fermer (Échap)">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Dictionary Tab */}
                    {activeTab === 'dictionary' && <DictionaryTab />}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div className="flex-1 p-5 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)]">
                            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Santé des connaissances</h2>
                            <p className="text-[var(--color-text-muted)] mb-7">Statistiques globales de votre apprentissage.</p>
                            <KnowledgeHealthWidget 
                                cards={cards} 
                                onReviewLowQuality={() => {
                                    setActiveFilters(['quality_ebauche', 'quality_incomplet']);
                                    onClose();
                                }} 
                            />
                        </div>
                    )}

                    {/* General / Appearance Tab */}
                    {activeTab === 'general' && <AppearanceTab onCloseSettings={onClose} />}

                    {/* Data Tab */}
                    {activeTab === 'data' && <DataTab />}

                    {/* Intelligence Tab */}
                    {activeTab === 'intelligence' && <IntelligenceTab />}

                    {/* Revision Tab */}
                    {activeTab === 'revision' && <RevisionTab />}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
