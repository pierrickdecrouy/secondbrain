import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Database,
    X,
    Plus,
    MagnifyingGlass,
    Trash,
    Books,
    Palette,
    ArrowCounterClockwise,
    Brain,
    Lightning,
    ShieldWarning,
    ChartLine,
    Timer
} from '@phosphor-icons/react';
import { KnowledgeHealthWidget } from './KnowledgeHealthWidget';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';
import { loadCustomAbbreviations, saveCustomAbbreviations, resetToDefaults, saveCardsAsync } from '../storage';
import { MEDICAL_ABBREVIATIONS as defaultAbbreviations } from '../medicalAbbreviations';
import './SettingsPage.css';
import { useTheme } from '../context/ThemeContext';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../linkFeedback';
import { isExamModeActive, EXAM_MODE_WINDOW_DAYS } from '../algorithms/srs';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../persistentSettings';

const SRS_SETTINGS_KEY = 'pharmabrain_srs_settings';

interface SrsSettings {
    examModeEnabled: boolean;
    examDate: string;
}

function loadSrsSettings(): SrsSettings {
    return loadSettingSync<SrsSettings>(SRS_SETTINGS_KEY, { examModeEnabled: false, examDate: '' });
}

function saveSrsSettings(settings: SrsSettings): void {
    saveSettingAsync(SRS_SETTINGS_KEY, settings);
}

interface SettingsPageProps {
    onClose: () => void;
    onSave?: () => void;
    availableCategories?: string[]; // Added property
    cards: import('../types').Card[];
    onReviewLowQuality: () => void;
}

type Tab = 'dictionary' | 'stats' | 'general' | 'data' | 'intelligence' | 'revision';

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

    // Dashboard stats (loaded when intelligence tab is active)
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
    useEffect(() => {
        if (activeTab === 'intelligence') {
            setDashStats(getDashboardStats());
        }
    }, [activeTab]);

    // SRS / Exam-mode settings
    const [srsSettings, setSrsSettings] = useState<SrsSettings>(() => loadSrsSettings());

    useEffect(() => {
        loadSettingAsync<SrsSettings>(SRS_SETTINGS_KEY, { examModeEnabled: false, examDate: '' }).then(setSrsSettings);
    }, []);

    const handleSrsSettingsChange = (patch: Partial<SrsSettings>) => {
        const updated = { ...srsSettings, ...patch };
        setSrsSettings(updated);
        saveSrsSettings(updated);
    };

    const examActive = isExamModeActive({
        learningSteps: [1, 10],
        defaultEaseFactor: 2.5,
        minEaseFactor: 1.3,
        fuzzEnabled: true,
        examModeEnabled: srsSettings.examModeEnabled,
        examDate: srsSettings.examDate || null,
    });

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
                            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            <ChartLine size={18} /> Statistiques
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
                        <li
                            className={`nav-item ${activeTab === 'intelligence' ? 'active' : ''}`}
                            onClick={() => setActiveTab('intelligence')}
                        >
                            <Brain size={18} /> Intelligence
                        </li>
                        <li
                            className={`nav-item ${activeTab === 'revision' ? 'active' : ''}`}
                            onClick={() => setActiveTab('revision')}
                        >
                            <Timer size={18} /> Révision
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
                                        <Books size={16} style={{ marginRight: 8 }} />
                                        Bibliothèque <span className="counter">{Object.keys(abbreviations).length}</span>
                                    </div>
                                    <div className="search-box">
                                        <MagnifyingGlass size={14} />
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
                                            <Trash
                                                size={16}
                                                className="delete-icon"
                                                onClick={() => handleDelete(key)}
                                            />
                                        </div>
                                    ))}

                                    {filteredAbbreviations.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#8c9b9f' }}>
                                            <MagnifyingGlass size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                            <p style={{ fontSize: '0.9rem' }}>Aucun résultat trouvé.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div style={{ padding: '40px 60px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '100%', maxWidth: '600px', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px' }}>Tableau de bord</h2>
                                <p style={{ color: '#8c9b9f' }}>Suivez la santé de votre base de connaissances.</p>
                            </div>

                            <KnowledgeHealthWidget
                                cards={props.cards}
                                onReviewLowQuality={() => {
                                    onClose(); // Close settings first
                                    props.onReviewLowQuality();
                                }}
                            />
                        </div>
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
                                    <ArrowCounterClockwise size={14} /> Restaurer
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
                        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px', overflowY: 'auto', height: '100%' }}>
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
                                        <Trash size={24} />
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

                            {/* DELETE ALL DATA (New Danger Zone) */}
                            <div style={{
                                padding: '24px',
                                border: '1px solid #c53030',
                                borderRadius: '16px',
                                background: '#fff5f5',
                                marginTop: '24px'
                            }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        padding: '12px', background: '#c53030', borderRadius: '12px',
                                        color: 'white', height: 'fit-content'
                                    }}>
                                        <ShieldWarning size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#742a2a', marginBottom: '8px' }}>ZONE MORTELLE</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#742a2a', lineHeight: '1.5', marginBottom: '20px' }}>
                                            Supprimer TOUTES les données (Fiches, Liens, Dictionnaire, Intelligence).
                                            L'application repartira de zéro comme au premier jour.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                if (confirm('ATTENTION : Voulez-vous vraiment TOUT SUPPRIMER ?')) {
                                                    if (confirm('C\'est votre DERNIÈRE CHANCE. Cette action est IRRÉVERSIBLE. Êtes-vous sûr ?')) {
                                                        // 1. Clear Cards
                                                        await saveCardsAsync([]);
                                                        // 2. Clear Dict
                                                        resetToDefaults();
                                                        // 3. Clear Intelligence
                                                        resetFeedback();

                                                        // 4. Force Reload
                                                        window.location.reload();
                                                    }
                                                }
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#c53030',
                                                border: 'none',
                                                color: 'white',
                                                fontWeight: 700,
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 6px rgba(197, 48, 48, 0.2)'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Trash size={16} />
                                                TOUT SUPPRIMER
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Intelligence Tab */}
                    {activeTab === 'intelligence' && dashStats && (
                        <div style={{ padding: '30px 40px', overflowY: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px' }}>Intelligence des liens</h2>
                                <p style={{ color: '#8c9b9f' }}>Tableau de bord de qualité de l'algorithme d'apprentissage automatique.</p>
                            </div>

                            {/* Learning Score Gauge */}
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '20px',
                                padding: '30px',
                                color: 'white',
                                textAlign: 'center',
                                marginBottom: '24px'
                            }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800 }}>
                                    {dashStats.learningScore}<span style={{ fontSize: '1.2rem', opacity: 0.8 }}>/100</span>
                                </div>
                                <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px' }}>Score d'apprentissage</div>
                                <div style={{
                                    marginTop: '16px',
                                    height: '8px',
                                    background: 'rgba(255,255,255,0.25)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${dashStats.learningScore}%`,
                                        background: 'white',
                                        borderRadius: '4px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                {[
                                    { label: 'Liens générés', value: dashStats.totalLinksGenerated, color: '#3b82f6' },
                                    { label: 'Supprimés', value: dashStats.totalSuppressed, color: '#ef4444' },
                                    { label: 'Manuels', value: dashStats.totalManual, color: '#22c55e' },
                                    { label: 'Taux acceptation', value: `${dashStats.acceptanceRate}%`, color: '#8b5cf6' }
                                ].map(stat => (
                                    <div key={stat.label} style={{
                                        background: 'white',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '14px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                                    }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#8c9b9f', marginTop: '4px' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Patterns & Vetoes */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                                }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Brain className="text-purple-500" size={16} /> Patterns appris</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Positifs (boosts)</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{dashStats.positivePatternCount}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Négatifs (pénalités)</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{dashStats.negativePatternCount}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Vetoes (hard)</span>
                                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{dashStats.vetoCount}</span>
                                    </div>
                                </div>

                                {/* Type Pair Scores */}
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                                }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lightning className="text-amber-500" size={16} /> Scores type-pair appris</h3>
                                    {Object.entries(dashStats.typePairScores).length === 0 ? (
                                        <div style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>Pas encore de données</div>
                                    ) : (
                                        Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                                            <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{pair.replace('|', ' ↔ ')}</span>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : '#6b7280',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Toxic Keywords */}
                            {dashStats.topToxicKeywords.length > 0 && (
                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    marginBottom: '24px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                                }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldWarning className="text-red-500" size={16} /> Mots-clés toxiques</h3>
                                    <p style={{ color: '#8c9b9f', fontSize: '0.8rem', marginBottom: '12px' }}>
                                        Ces mots génèrent souvent des faux positifs. L'algo les pénalise automatiquement.
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {dashStats.topToxicKeywords.map(tw => (
                                            <span key={tw.word} style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                background: tw.count >= 3 ? '#fef2f2' : '#fff7ed',
                                                color: tw.count >= 3 ? '#dc2626' : '#d97706',
                                                border: `1px solid ${tw.count >= 3 ? '#fecaca' : '#fed7aa'}`
                                            }}>
                                                {tw.word} <span style={{ opacity: 0.7 }}>×{tw.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reset Button */}
                            <div style={{
                                padding: '20px',
                                border: '1px solid #fed7d7',
                                borderRadius: '14px',
                                background: '#fff5f5'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '10px', background: '#fed7d7', borderRadius: '10px', color: '#c53030' }}>
                                        <Trash size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>Réinitialiser l'intelligence</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Supprime tous les patterns appris, vetoes et mots toxiques.</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Réinitialiser toute l\'intelligence apprise ? L\'algo repartira de zéro.')) {
                                                resetFeedback();
                                                setDashStats(getDashboardStats());
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'white',
                                            border: '1px solid #feb2b2',
                                            color: '#c53030',
                                            fontWeight: 600,
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Révision Tab – Exam mode & SRS settings */}
                    {activeTab === 'revision' && (
                        <div style={{ padding: '40px 60px', overflowY: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Timer size={24} color="#6366f1" />
                                    Paramètres de Révision
                                </h2>
                                <p style={{ color: '#8c9b9f' }}>
                                    Configurez le mode "Examen Proche" pour intensifier automatiquement vos révisions dans les {EXAM_MODE_WINDOW_DAYS} jours précédant l'examen.
                                </p>
                            </div>

                            {/* Exam Mode Card */}
                            <div style={{
                                background: examActive ? 'linear-gradient(135deg, #fef3c7, #fff7ed)' : 'white',
                                border: `1px solid ${examActive ? '#fcd34d' : '#e2e8f0'}`,
                                borderRadius: '16px',
                                padding: '28px',
                                marginBottom: '24px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                transition: 'all 0.3s ease',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {examActive && <span style={{ fontSize: '1rem' }}>🚨</span>}
                                            Mode "Examen Proche"
                                            {examActive && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    background: '#fcd34d',
                                                    color: '#92400e',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    ACTIF
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                                            Quand activé et que l'examen est dans les {EXAM_MODE_WINDOW_DAYS} jours,
                                            l'intervalle SRS maximum est limité à 14 jours pour intensifier les révisions.
                                        </p>
                                    </div>
                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleSrsSettingsChange({ examModeEnabled: !srsSettings.examModeEnabled })}
                                        style={{
                                            position: 'relative',
                                            width: '52px',
                                            height: '28px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            background: srsSettings.examModeEnabled ? '#6366f1' : '#d1d5db',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                            flexShrink: 0,
                                            marginLeft: '16px',
                                        }}
                                        aria-label="Activer le mode examen"
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: srsSettings.examModeEnabled ? '28px' : '4px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            transition: 'left 0.2s ease',
                                            display: 'block',
                                        }} />
                                    </button>
                                </div>

                                {/* Exam Date Picker */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Date de l'examen
                                    </label>
                                    <input
                                        type="date"
                                        value={srsSettings.examDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => handleSrsSettingsChange({ examDate: e.target.value })}
                                        disabled={!srsSettings.examModeEnabled}
                                        style={{
                                            padding: '10px 14px',
                                            border: `1px solid ${srsSettings.examModeEnabled ? '#a5b4fc' : '#e2e8f0'}`,
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            color: srsSettings.examModeEnabled ? '#0f172a' : '#94a3b8',
                                            background: srsSettings.examModeEnabled ? 'white' : '#f8fafc',
                                            cursor: srsSettings.examModeEnabled ? 'pointer' : 'not-allowed',
                                            outline: 'none',
                                            width: '200px',
                                        }}
                                    />
                                </div>

                                {/* Status banner */}
                                {srsSettings.examModeEnabled && srsSettings.examDate && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: examActive ? '#fef3c7' : '#f0fdf4',
                                        border: `1px solid ${examActive ? '#fcd34d' : '#86efac'}`,
                                        fontSize: '0.85rem',
                                        color: examActive ? '#92400e' : '#166534',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {examActive
                                            ? `🚨 Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14j.`
                                            : `✅ Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera automatiquement à J-${EXAM_MODE_WINDOW_DAYS}.`
                                        }
                                    </div>
                                )}
                                {srsSettings.examModeEnabled && !srsSettings.examDate && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: '#fef9c3',
                                        border: '1px solid #fde047',
                                        fontSize: '0.85rem',
                                        color: '#713f12',
                                    }}>
                                        ⚠️ Sélectionnez une date d'examen pour activer le mode.
                                    </div>
                                )}
                            </div>

                            {/* Info box */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '20px',
                                fontSize: '0.85rem',
                                color: '#475569',
                                lineHeight: '1.6'
                            }}>
                                <strong style={{ display: 'block', marginBottom: '8px', color: '#0f172a' }}>💡 Comment ça fonctionne ?</strong>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    <li>En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.</li>
                                    <li>Quand l'examen est proche ({EXAM_MODE_WINDOW_DAYS} jours), l'intervalle maximum passe à <strong>14 jours</strong>.</li>
                                    <li>Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.</li>
                                    <li>Le mode se désactive automatiquement une fois l'examen passé.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                </main>
            </div >
        </div >
    );
};

export default SettingsPage;
