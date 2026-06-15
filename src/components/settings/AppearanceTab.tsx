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

    return (
        <div className="settings-tab-content">
            
            <h2 className="settings-section-title">Thème de l'Application</h2>
            <p className="settings-section-desc">Choisissez l'apparence générale de PharmaBrain.</p>
            
            <div className="settings-card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setThemeMode('light')}
                    style={{
                        flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        background: themeMode === 'light' ? 'var(--color-bg)' : 'transparent',
                        border: themeMode === 'light' ? '2px solid var(--color-drug)' : '2px solid var(--color-border)',
                        color: themeMode === 'light' ? 'var(--color-drug)' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    <Sun size={28} />
                    <span style={{ fontWeight: 600 }}>Clair</span>
                </button>
                <button 
                    onClick={() => setThemeMode('dark')}
                    style={{
                        flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        background: themeMode === 'dark' ? 'var(--color-bg)' : 'transparent',
                        border: themeMode === 'dark' ? '2px solid var(--color-drug)' : '2px solid var(--color-border)',
                        color: themeMode === 'dark' ? 'var(--color-drug)' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    <Moon size={28} />
                    <span style={{ fontWeight: 600 }}>Sombre</span>
                </button>
                <button 
                    onClick={() => setThemeMode('system')}
                    style={{
                        flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        background: themeMode === 'system' ? 'var(--color-bg)' : 'transparent',
                        border: themeMode === 'system' ? '2px solid var(--color-drug)' : '2px solid var(--color-border)',
                        color: themeMode === 'system' ? 'var(--color-drug)' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    <Monitor size={28} />
                    <span style={{ fontWeight: 600 }}>Système</span>
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px' }}>
                <h2 className="settings-section-title" style={{ marginBottom: 0 }}>Catégories & Couleurs</h2>
                <button
                    onClick={() => {
                        if (confirm('Réinitialiser les couleurs et icônes par défaut ?')) {
                            resetCategoryColors();
                            resetCategoryIcons();
                        }
                    }}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        background: 'transparent', border: '1px solid var(--color-border)', 
                        padding: '6px 12px', borderRadius: '8px', color: 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                    }}
                >
                    <ArrowCounterClockwise size={14} /> Restaurer
                </button>
            </div>
            <p className="settings-section-desc">Personnalisez les couleurs et icônes des types de fiches.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {categoriesToDisplay.map(type => (
                    <div key={type} className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
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
                                <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem' }}>{categoryLabels[type] || type}</span>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                                    <div style={{ width: '100%', height: '100%', borderRadius: '8px', backgroundColor: getCategoryColor(type), border: '2px solid var(--color-border)' }} />
                                </div>
                                <input
                                    type="text"
                                    value={getCategoryColor(type)}
                                    onChange={(e) => setCategoryColor(type, e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text)',
                                        fontFamily: 'monospace',
                                        background: 'var(--color-bg)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                                                : '1px solid var(--color-border)',
                                            background: getCategoryIcon(type) === iconName
                                                ? `${getCategoryColor(type)}15`
                                                : 'var(--color-bg)',
                                            color: getCategoryIcon(type) === iconName
                                                ? getCategoryColor(type)
                                                : 'var(--color-text-muted)',
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

            {/* Tutoriel Section */}
            <div className="settings-card" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Tutoriel & Aide</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Revoyez le guide interactif pour redécouvrir les fonctionnalités d'Extnd.</p>
                </div>
                <button
                    onClick={() => {
                        onCloseSettings();
                        setTimeout(() => {
                            import('../../tutorial').then(({ startTutorial }) => startTutorial(true));
                        }, 150);
                    }}
                    className="btn-add"
                >
                    <MagnifyingGlass size={16} /> Rejouer
                </button>
            </div>
        </div>
    );
};
