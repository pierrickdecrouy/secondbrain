import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Settings,
    Database,
    X,
    Plus,
    Search,
    Trash2,
    Library
} from 'lucide-react';
import { loadCustomAbbreviations, saveCustomAbbreviations, resetToDefaults } from '../storage';
import { MEDICAL_ABBREVIATIONS as defaultAbbreviations } from '../medicalAbbreviations';
import './SettingsPage.css';

interface SettingsPageProps {
    onClose: () => void;
    onSave?: () => void;
}

type Tab = 'dictionary' | 'general' | 'data';

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dictionary');
    const [abbreviations, setAbbreviations] = useState<{ [key: string]: string }>({});
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loaded = loadCustomAbbreviations();
        setAbbreviations(loaded);
    }, []);

    const handleAdd = () => {
        if (newKey && newValue) {
            const updated = { ...abbreviations, [newKey.toLowerCase()]: newValue };
            setAbbreviations(updated);
            saveCustomAbbreviations(updated);
            setNewKey('');
            setNewValue('');
            if (onSave) onSave();
        }
    };

    const handleDelete = (key: string) => {
        const updated = { ...abbreviations };
        delete updated[key];
        setAbbreviations(updated);
        saveCustomAbbreviations(updated);
        if (onSave) onSave();
    };

    const handleReset = () => {
        if (window.confirm('Voulez-vous vraiment réinitialiser le dictionnaire par défaut ?')) {
            resetToDefaults();
            // Convert Record<string, string[]> to Record<string, string> for the state
            const defaultSimple: Record<string, string> = {};
            Object.entries(defaultAbbreviations).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                    defaultSimple[key] = values[0];
                }
            });
            setAbbreviations(defaultSimple);
            if (onSave) onSave();
        }
    };

    // Filtrage pour la recherche
    const filteredAbbreviations = Object.entries(abbreviations).filter(([key, value]) =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a[0].localeCompare(b[0]));

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
                <aside className="sidebar">
                    <div className="sidebar-title">Paramètres</div>
                    <div className="sidebar-version">PharmaBrain v1.0</div>

                    <ul className="nav-menu">
                        <li
                            className={`nav-item ${activeTab === 'dictionary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dictionary')}
                        >
                            <BookOpen size={18} /> Dictionnaire
                        </li>
                        <li
                            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <Settings size={18} /> Général
                        </li>
                        <li
                            className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            <Database size={18} /> Données
                        </li>
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="settings-main-content">
                    <X size={20} className="close-btn" onClick={onClose} />

                    {/* Dictionnaire Tab */}
                    {activeTab === 'dictionary' && (
                        <>
                            {/* Formulaire d'ajout */}
                            <div className="section-header">
                                <div className="section-title">
                                    <div className="add-icon-circle"><Plus size={14} /></div>
                                    Ajouter une définition
                                </div>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Ex: IV"
                                        className="input-field input-short"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Ex: Intraveineuse"
                                        className="input-field input-long"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                    <button className="btn-add" onClick={handleAdd}>
                                        <Plus size={16} /> Ajouter
                                    </button>
                                </div>
                            </div>

                            {/* Liste Bibliothèque */}
                            <div className="list-section">
                                <div className="list-header">
                                    <div className="list-title">
                                        <Library size={16} style={{ marginRight: 8 }} />
                                        Bibliothèque <span className="counter">{Object.keys(abbreviations).length}</span>
                                    </div>
                                    <div className="search-box">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="scroll-area">
                                    {/* Items */}
                                    {filteredAbbreviations.map(([key, value]) => (
                                        <div key={key} className="definition-row">
                                            <div className="badge">{key}</div>
                                            <div className="def-text">{value}</div>
                                            <Trash2
                                                size={16}
                                                className="delete-icon"
                                                onClick={() => handleDelete(key)}
                                            />
                                        </div>
                                    ))}

                                    {filteredAbbreviations.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#8c9b9f' }}>
                                            <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                            <p style={{ fontSize: '0.9rem' }}>Aucun résultat trouvé.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c9b9f' }}>
                            <Settings size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#2c3e50', marginBottom: 10 }}>Paramètres généraux</h3>
                            <p>Cette section sera bientôt disponible.</p>
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{
                                    width: '64px', height: '64px', background: 'rgba(79, 178, 134, 0.1)',
                                    borderRadius: '16px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 20px', color: '#4fb286'
                                }}>
                                    <Database size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '10px' }}>Gestion des données</h2>
                                <p style={{ color: '#8c9b9f' }}>Gérez vos préférences et réinitialisez vos données si nécessaire.</p>
                            </div>

                            <div style={{
                                padding: '24px',
                                border: '1px solid #fed7d7',
                                borderRadius: '16px',
                                background: '#fff5f5'
                            }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        padding: '12px', background: '#fed7d7', borderRadius: '12px',
                                        color: '#c53030', height: 'fit-content'
                                    }}>
                                        <Trash2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px' }}>Zone de danger</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: '1.5', marginBottom: '20px' }}>
                                            Restaurer le dictionnaire médical par défaut effacera toutes vos abréviations personnalisées.
                                            Cette action est irréversible.
                                        </p>
                                        <button
                                            onClick={handleReset}
                                            style={{
                                                padding: '10px 20px',
                                                background: 'white',
                                                border: '1px solid #feb2b2',
                                                color: '#c53030',
                                                fontWeight: 600,
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#c53030';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.color = '#c53030';
                                            }}
                                        >
                                            Réinitialiser le dictionnaire
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;