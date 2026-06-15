import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { KnowledgeHealthWidget } from './KnowledgeHealthWidget';
import './SettingsPage.css';
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
            className="settings-modal-overlay"
            onClick={handleOverlayClick}
        >
            <div className="settings-modal">
                {/* Sidebar */}
                <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Main Content */}
                <main className="settings-content">
                    {/* Header */}
                    <div className="settings-header">
                        <h2>Paramètres</h2>
                        <button className="btn-close" onClick={onClose} title="Fermer (Échap)">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Dictionary Tab */}
                    {activeTab === 'dictionary' && <DictionaryTab />}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div className="settings-tab-content">
                            <h2 className="settings-section-title">Santé des connaissances</h2>
                            <p className="settings-section-desc">Statistiques globales de votre apprentissage.</p>
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
