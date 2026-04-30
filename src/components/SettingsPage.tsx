import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen,
    Database,
    X,
    Plus,
    Search,
    Trash2,
    Library,
    Palette,
    RotateCcw,
    Brain,
    Zap,
    ShieldAlert,
    Activity,
    Download,
    Upload,
    Calendar,
    Clock,
} from 'lucide-react';
import { KnowledgeHealthWidget } from './KnowledgeHealthWidget';
import { DynamicIcon, AVAILABLE_ICONS } from './DynamicIcon';
import { loadCustomAbbreviations, saveCustomAbbreviations, resetToDefaults, saveCardsAsync, loadSrsConfig, saveSrsConfig } from '../storage';
import { MEDICAL_ABBREVIATIONS as defaultAbbreviations } from '../medicalAbbreviations';
import './SettingsPage.css';
import { useTheme } from '../context/ThemeContext';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../linkFeedback';
import type { SRSConfig } from '../algorithms/srs';
import { daysUntilExam } from '../algorithms/srs';
import type { Node, Link } from '../types';

interface SettingsPageProps {
    onClose: () => void;
    onSave?: () => void;
    availableCategories?: string[]; // Added property
    cards: import('../types').Card[];
    onReviewLowQuality: () => void;
    graphNodes?: Node[];
    graphLinks?: Link[];
    onReviewCard?: (cardId: string) => void;
}

type Tab = 'dictionary' | 'stats' | 'general' | 'data' | 'intelligence' | 'srs';

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
    const [abbrImportMsg, setAbbrImportMsg] = useState<string | null>(null);
    const abbrFileRef = useRef<HTMLInputElement>(null);

    // SRS Config state
    const [srsConfig, setSrsConfig] = useState<SRSConfig>(() => loadSrsConfig());
    const examDaysLeft = daysUntilExam(srsConfig.examDate);

    const handleSrsConfigChange = <K extends keyof SRSConfig>(key: K, value: SRSConfig[K]) => {
        const updated = { ...srsConfig, [key]: value };
        setSrsConfig(updated);
        saveSrsConfig(updated);
    };

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

    // Export abbreviations as JSON
    const handleExportAbbreviations = () => {
        const blob = new Blob([JSON.stringify(abbreviations, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `abbreviations-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import abbreviations from JSON file
    const handleImportAbbreviations = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string);
                if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setAbbrImportMsg('❌ Format invalide. Le fichier doit être un objet JSON {"abbr": "définition"}.');
                    return;
                }
                // Validate and merge
                const newEntries: Record<string, string> = {};
                Object.entries(parsed).forEach(([k, v]) => {
                    if (typeof k === 'string' && typeof v === 'string' && k.length <= 20 && v.length <= 200) {
                        newEntries[k.toLowerCase().trim()] = v.trim();
                    }
                });
                const merged = { ...abbreviations, ...newEntries };
                setAbbreviations(merged);
                saveCustomAbbreviations(merged);
                const added = Object.keys(newEntries).length;
                setAbbrImportMsg(`✅ ${added} abréviation${added !== 1 ? 's' : ''} importée${added !== 1 ? 's' : ''} et fusionnée${added !== 1 ? 's' : ''}.`);
                if (onSave) onSave();
            } catch {
                setAbbrImportMsg('❌ Fichier JSON invalide.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

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
                            <Activity size={18} /> Statistiques
                        </li>
                        <li
                            className={`nav-item ${activeTab === 'srs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('srs')}
                        >
                            <Calendar size={18} /> Révision SRS
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

                                {/* Export / Import buttons */}
                                <div style={{ display: 'flex', gap: '10px', padding: '12px 0 0', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
                                    <button
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e9ecef', background: '#f8f9fa', color: '#495057', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                        onClick={handleExportAbbreviations}
                                    >
                                        <Download size={14} /> Exporter JSON
                                    </button>
                                    <button
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e9ecef', background: '#f8f9fa', color: '#495057', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                        onClick={() => abbrFileRef.current?.click()}
                                    >
                                        <Upload size={14} /> Importer JSON
                                    </button>
                                    <input
                                        ref={abbrFileRef}
                                        type="file"
                                        accept=".json"
                                        style={{ display: 'none' }}
                                        onChange={handleImportAbbreviations}
                                    />
                                    {abbrImportMsg && (
                                        <span style={{ fontSize: '0.8rem', color: abbrImportMsg.startsWith('✅') ? '#16a34a' : '#dc2626', alignSelf: 'center' }}>
                                            {abbrImportMsg}
                                        </span>
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
                                graphNodes={props.graphNodes}
                                graphLinks={props.graphLinks}
                                onReviewCard={props.onReviewCard}
                                onReviewLowQuality={() => {
                                    onClose(); // Close settings first
                                    props.onReviewLowQuality();
                                }}
                            />
                        </div>
                    )}

                    {/* SRS / Exam Mode Tab */}
                    {activeTab === 'srs' && (
                        <div style={{ padding: '40px 60px', overflowY: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50', marginBottom: '8px' }}>
                                    Paramètres de révision
                                </h2>
                                <p style={{ color: '#8c9b9f' }}>
                                    Configurez l'algorithme de répétition espacée (SRS/FSRS).
                                </p>
                            </div>

                            {/* Exam Mode Card */}
                            <div style={{
                                background: srsConfig.examModeEnabled
                                    ? 'linear-gradient(135deg, #ede9fe 0%, #fdf4ff 100%)'
                                    : 'white',
                                border: `1.5px solid ${srsConfig.examModeEnabled ? '#8b5cf6' : '#e9ecef'}`,
                                borderRadius: '16px',
                                padding: '28px',
                                marginBottom: '20px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <Calendar size={20} color="#8b5cf6" />
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                                                Mode Examen Proche
                                            </h3>
                                            {srsConfig.examModeEnabled && examDaysLeft !== null && examDaysLeft > 0 && (
                                                <span style={{
                                                    background: examDaysLeft <= 7 ? '#dc2626' : '#d97706',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    padding: '2px 10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                }}>
                                                    J-{examDaysLeft}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                                            Active quand l'examen est à ≤15 jours. Divise les intervalles par 2 pour intensifier les révisions.
                                        </p>
                                    </div>
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleSrsConfigChange('examModeEnabled', !srsConfig.examModeEnabled)}
                                        style={{
                                            width: '48px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            border: 'none',
                                            background: srsConfig.examModeEnabled ? '#8b5cf6' : '#d1d5db',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: srsConfig.examModeEnabled ? '24px' : '3px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            transition: 'left 0.2s',
                                        }} />
                                    </button>
                                </div>

                                {srsConfig.examModeEnabled && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Date de l'examen
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input
                                                type="date"
                                                value={srsConfig.examDate ?? ''}
                                                onChange={(e) => handleSrsConfigChange('examDate', e.target.value || null)}
                                                style={{
                                                    padding: '8px 12px',
                                                    border: '1.5px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    color: '#374151',
                                                    background: 'white',
                                                }}
                                            />
                                            {examDaysLeft !== null && (
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    color: examDaysLeft <= 0 ? '#dc2626' : examDaysLeft <= 7 ? '#d97706' : examDaysLeft <= 15 ? '#6d28d9' : '#6b7280',
                                                    fontWeight: 600,
                                                }}>
                                                    {examDaysLeft <= 0
                                                        ? "L'examen est passé"
                                                        : examDaysLeft <= 15
                                                        ? `⚡ Mode actif — J-${examDaysLeft} (intervalles ÷2)`
                                                        : `Dans ${examDaysLeft} jours (mode s'activera à J-15)`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Context Hints */}
                            <div style={{
                                background: 'white',
                                border: '1px solid #e9ecef',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <Clock size={18} color="#3b82f6" />
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                                                Rappels contextuels
                                            </h3>
                                        </div>
                                        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                                            Affiche les liens du graphe comme aide-mémoire pendant la révision.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleSrsConfigChange('showContextHint', !srsConfig.showContextHint)}
                                        style={{
                                            width: '48px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            border: 'none',
                                            background: srsConfig.showContextHint ? '#3b82f6' : '#d1d5db',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: srsConfig.showContextHint ? '24px' : '3px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            transition: 'left 0.2s',
                                        }} />
                                    </button>
                                </div>
                            </div>
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
                                        <ShieldAlert size={24} />
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
                                                <Trash2 size={16} />
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
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap className="text-amber-500" size={16} /> Scores type-pair appris</h3>
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
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert className="text-red-500" size={16} /> Mots-clés toxiques</h3>
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
                                        <Trash2 size={20} />
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
                </main>
            </div >
        </div >
    );
};

export default SettingsPage;