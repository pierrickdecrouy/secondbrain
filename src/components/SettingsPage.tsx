import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Database,
    X,
    Plus,
    Search,
    Trash2,
    Library,
    Palette,
    RotateCcw
} from 'lucide-react';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';
import { loadCustomAbbreviations, saveCustomAbbreviations, resetToDefaults } from '../storage';
import { MEDICAL_ABBREVIATIONS as defaultAbbreviations } from '../medicalAbbreviations';
import './SettingsPage.css';
import { useTheme } from '../context/ThemeContext';

interface SettingsPageProps {
    onClose: () => void;
    onSave?: () => void;
    availableCategories?: string[]; // Added property
}

type Tab = 'dictionary' | 'general' | 'data';

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const { onClose, onSave } = props;
    const {
        categoryColors,
        categoryIcons,
        setCategoryColor,
        setCategoryIcon,
        resetCategoryColors,
        resetCategoryIcons,
        getCategoryColor,
        getCategoryIcon
    } = useTheme();
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

    const categoryLabels: Record<string, string> = {
        drug: 'Médicaments',
        patho: 'Pathologies',
        physio: 'Physiologie',
        data: 'Données'
    };

    const categoriesToDisplay = Array.from(new Set([
        ...Object.keys(categoryColors),
        ...(activeTab === 'general' ? (props.availableCategories || []) : [])
    ])).sort();

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
                            <Palette size={18} /> Apparence
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

                    {/* General Tab (Appearance) */}
                    {activeTab === 'general' && (
                        <div style={{ padding: '40px 60px', overflowY: 'auto', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px' }}>Thème & Couleurs</h2>
                                    <p style={{ color: '#8c9b9f' }}>Personnalisez les couleurs des catégories.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Réinitialiser les couleurs et icônes par défaut ?')) {
                                            resetCategoryColors();
                                            resetCategoryIcons();
                                        }
                                    }}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <RotateCcw size={14} /> Restaurer
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {categoriesToDisplay.map(type => (
                                    <div key={type} style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '16px',
                                        border: '1px solid #e9ecef',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}>
                                        {/* Header with Preview */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    backgroundColor: getCategoryColor(type),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    flexShrink: 0
                                                }}>
                                                    <DynamicIcon name={categoryIcons[type]} size={20} />
                                                </div>
                                                <span style={{ fontWeight: 600, color: '#2c3e50', fontSize: '1rem' }}>{categoryLabels[type] || type}</span>
                                            </div>
                                        </div>

                                        {/* Color Picker */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8c9b9f', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Couleur
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                                                    <input
                                                        type="color"
                                                        value={getCategoryColor(type)}
                                                        onChange={(e) => setCategoryColor(type, e.target.value)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0, left: 0,
                                                            width: '100%', height: '100%',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            background: 'transparent',
                                                            opacity: 0
                                                        }}
                                                    />
                                                    <div style={{ width: '100%', height: '100%', borderRadius: '8px', backgroundColor: getCategoryColor(type), border: '2px solid #e9ecef' }} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={getCategoryColor(type)}
                                                    onChange={(e) => setCategoryColor(type, e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 12px',
                                                        border: '1px solid #e9ecef',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        color: '#495057',
                                                        fontFamily: 'monospace',
                                                        background: '#f8f9fa'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Icon Picker */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#8c9b9f', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Icône
                                            </label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {AVAILABLE_ICONS.map(iconName => (
                                                    <button
                                                        key={iconName}
                                                        onClick={() => setCategoryIcon(type, iconName)}
                                                        title={iconName}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            border: getCategoryIcon(type) === iconName
                                                                ? `2px solid ${getCategoryColor(type)}`
                                                                : '1px solid #e9ecef',
                                                            background: getCategoryIcon(type) === iconName
                                                                ? `${getCategoryColor(type)}15` // 15 = ~8% opacity hex
                                                                : 'white',
                                                            color: getCategoryIcon(type) === iconName
                                                                ? getCategoryColor(type)
                                                                : '#6c757d',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <DynamicIcon name={iconName} size={18} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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