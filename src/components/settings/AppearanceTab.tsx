import React, { useMemo } from 'react';
import { MagnifyingGlass, ArrowCounterClockwise, Monitor, Moon, Sun } from '@phosphor-icons/react';
import { DynamicIcon, AVAILABLE_ICONS } from '../DynamicIcon';
import { useTheme } from '../../context/ThemeContext';
import { COURSE_TYPE } from '../../types';
import { useCards } from '../../context/CardContext';

interface AppearanceTabProps {
    onCloseSettings: () => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ onCloseSettings }) => {
    const { cards } = useCards();
    const availableCategories = Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort();
    
    const {
        categoryColors,
        categoryIcons,
        setCategoryColor,
        setCategoryIcon,
        resetCategoryColors,
        resetCategoryIcons,
        getCategoryColor,
        getCategoryIcon,
        themeMode,
        setThemeMode
    } = useTheme();

    const categoryLabels: Record<string, string> = {
        drug: 'Médicaments',
        patho: 'Pathologies',
        physio: 'Physiologie',
        data: 'Données'
    };

    const categoriesToDisplay = useMemo(() => {
        return Array.from(new Set([
            ...Object.keys(categoryColors),
            ...availableCategories
        ])).sort();
    }, [categoryColors, availableCategories]);

    const cardStyle = {
        backgroundColor: '#0f1420',
        borderRadius: 16,
        border: '1px solid #1e293b',
        padding: 24,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Theme Section */}
            <div>
                <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px 0' }}>Apparence</h2>
                    <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Choisissez l'apparence générale d'Extnd.</p>
                </div>
                
                <div style={{ ...cardStyle, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setThemeMode('light')}
                        style={{
                            flex: 1, minWidth: 120, padding: 16, borderRadius: 12,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: themeMode === 'light' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            border: themeMode === 'light' ? '2px solid #10b981' : '2px solid #1e293b',
                            color: themeMode === 'light' ? '#34d399' : '#94a3b8'
                        }}
                    >
                        <Sun size={28} />
                        <span style={{ fontWeight: 600 }}>Clair</span>
                    </button>
                    <button 
                        onClick={() => setThemeMode('dark')}
                        style={{
                            flex: 1, minWidth: 120, padding: 16, borderRadius: 12,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            border: themeMode === 'dark' ? '2px solid #10b981' : '2px solid #1e293b',
                            color: themeMode === 'dark' ? '#34d399' : '#94a3b8'
                        }}
                    >
                        <Moon size={28} />
                        <span style={{ fontWeight: 600 }}>Sombre</span>
                    </button>
                    <button 
                        onClick={() => setThemeMode('system')}
                        style={{
                            flex: 1, minWidth: 120, padding: 16, borderRadius: 12,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: themeMode === 'system' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            border: themeMode === 'system' ? '2px solid #10b981' : '2px solid #1e293b',
                            color: themeMode === 'system' ? '#34d399' : '#94a3b8'
                        }}
                    >
                        <Monitor size={28} />
                        <span style={{ fontWeight: 600 }}>Système</span>
                    </button>
                </div>
            </div>

            {/* Categories & Colors Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px 0' }}>Catégories & Couleurs</h2>
                        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Personnalisez les couleurs et icônes des types de fiches.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm('Réinitialiser les couleurs et icônes par défaut ?')) {
                                resetCategoryColors();
                                resetCategoryIcons();
                            }
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'transparent',
                            border: '1px solid #1e293b', padding: '6px 12px', borderRadius: 8, color: '#94a3b8',
                            cursor: 'pointer', fontSize: 13, fontWeight: 600
                        }}
                    >
                        <ArrowCounterClockwise size={14} /> Restaurer
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {categoriesToDisplay.map(type => (
                        <div key={type} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Header with Preview */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ backgroundColor: getCategoryColor(type), width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                    <DynamicIcon name={categoryIcons[type]} size={20} />
                                </div>
                                <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 16 }}>{categoryLabels[type] || type}</span>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Couleur
                                </label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                                        <input
                                            type="color"
                                            value={getCategoryColor(type)}
                                            onChange={(e) => setCategoryColor(type, e.target.value)}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0, background: 'transparent', opacity: 0 }}
                                        />
                                        <div style={{ backgroundColor: getCategoryColor(type), width: '100%', height: '100%', borderRadius: 8, border: '2px solid #1e293b', boxSizing: 'border-box' }} />
                                    </div>
                                    <input
                                        type="text"
                                        value={getCategoryColor(type)}
                                        onChange={(e) => setCategoryColor(type, e.target.value)}
                                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #1e293b', borderRadius: 8, fontSize: 14, color: '#f1f5f9', fontFamily: 'monospace', backgroundColor: '#0b0f17', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Icône
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {AVAILABLE_ICONS.map(iconName => (
                                        <button
                                            key={iconName}
                                            onClick={() => setCategoryIcon(type, iconName)}
                                            title={iconName}
                                            style={{
                                                border: getCategoryIcon(type) === iconName ? `2px solid ${getCategoryColor(type)}` : '1px solid #1e293b',
                                                background: getCategoryIcon(type) === iconName ? `${getCategoryColor(type)}15` : '#0b0f17',
                                                color: getCategoryIcon(type) === iconName ? getCategoryColor(type) : '#94a3b8',
                                                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
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

            {/* Tutoriel Section */}
            <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px 0' }}>Tutoriel & Aide</h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Revoyez le guide interactif pour redécouvrir les fonctionnalités d'Extnd.</p>
                </div>
                <button
                    onClick={() => {
                        onCloseSettings();
                        setTimeout(() => {
                            import('../../tutorial').then(({ startTutorial }) => startTutorial(true));
                        }, 150);
                    }}
                    style={{
                        backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
                    }}
                >
                    <MagnifyingGlass size={16} /> Rejouer
                </button>
            </div>
        </div>
    );
};
