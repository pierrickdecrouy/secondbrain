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
        <div className="flex-1 p-5 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)]">
            
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Thème de l'Application</h2>
            <p className="text-[var(--color-text-muted)] mb-7">Choisissez l'apparence générale de PharmaBrain.</p>
            
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6 flex gap-4 flex-wrap">
                <button 
                    onClick={() => setThemeMode('light')}
                    className={`flex-1 min-w-[120px] p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${themeMode === 'light' ? 'bg-[var(--color-bg)] border-2 border-[var(--color-drug)] text-[var(--color-drug)]' : 'bg-transparent border-2 border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
                >
                    <Sun size={28} />
                    <span className="font-semibold">Clair</span>
                </button>
                <button 
                    onClick={() => setThemeMode('dark')}
                    className={`flex-1 min-w-[120px] p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${themeMode === 'dark' ? 'bg-[var(--color-bg)] border-2 border-[var(--color-drug)] text-[var(--color-drug)]' : 'bg-transparent border-2 border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
                >
                    <Moon size={28} />
                    <span className="font-semibold">Sombre</span>
                </button>
                <button 
                    onClick={() => setThemeMode('system')}
                    className={`flex-1 min-w-[120px] p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${themeMode === 'system' ? 'bg-[var(--color-bg)] border-2 border-[var(--color-drug)] text-[var(--color-drug)]' : 'bg-transparent border-2 border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
                >
                    <Monitor size={28} />
                    <span className="font-semibold">Système</span>
                </button>
            </div>

            <div className="flex justify-between items-center mt-10 mb-2">
                <h2 className="text-2xl font-bold text-[var(--color-text)] mb-0">Catégories & Couleurs</h2>
                <button
                    onClick={() => {
                        if (confirm('Réinitialiser les couleurs et icônes par défaut ?')) {
                            resetCategoryColors();
                            resetCategoryIcons();
                        }
                    }}
                    className="flex items-center gap-2 bg-transparent border border-[var(--color-border)] py-1.5 px-3 rounded-lg text-[var(--color-text-muted)] cursor-pointer text-[0.85rem] font-semibold"
                >
                    <ArrowCounterClockwise size={14} /> Restaurer
                </button>
            </div>
            <p className="text-[var(--color-text-muted)] mb-7">Personnalisez les couleurs et icônes des types de fiches.</p>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                {categoriesToDisplay.map(type => (
                    <div key={type} className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4 mb-0">
                        {/* Header with Preview */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div style={{ backgroundColor: getCategoryColor(type) }} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <DynamicIcon name={categoryIcons[type]} size={20} />
                                </div>
                                <span className="font-semibold text-[var(--color-text)] text-base">{categoryLabels[type] || type}</span>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                                Couleur
                            </label>
                            <div className="flex gap-2 items-center">
                                <div className="relative w-9 h-9 shrink-0">
                                    <input
                                        type="color"
                                        value={getCategoryColor(type)}
                                        onChange={(e) => setCategoryColor(type, e.target.value)}
                                        className="absolute top-0 left-0 w-full h-full border-none rounded-lg cursor-pointer p-0 bg-transparent opacity-0"
                                    />
                                    <div style={{ backgroundColor: getCategoryColor(type) }} className="w-full h-full rounded-lg border-2 border-[var(--color-border)]" />
                                </div>
                                <input
                                    type="text"
                                    value={getCategoryColor(type)}
                                    onChange={(e) => setCategoryColor(type, e.target.value)}
                                    className="flex-1 py-2 px-3 border border-[var(--color-border)] rounded-lg text-[0.9rem] text-[var(--color-text)] font-mono bg-[var(--color-bg)]"
                                />
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                                Icône
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_ICONS.map(iconName => (
                                    <button
                                        key={iconName}
                                        onClick={() => setCategoryIcon(type, iconName)}
                                        title={iconName}
                                        style={{
                                            border: getCategoryIcon(type) === iconName ? `2px solid ${getCategoryColor(type)}` : '1px solid var(--color-border)',
                                            background: getCategoryIcon(type) === iconName ? `${getCategoryColor(type)}15` : 'var(--color-bg)',
                                            color: getCategoryIcon(type) === iconName ? getCategoryColor(type) : 'var(--color-text-muted)'
                                        }}
                                        className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
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
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mt-10 mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-[1.1rem] font-bold text-[var(--color-text)] mb-1">Tutoriel & Aide</h3>
                    <p className="text-[0.9rem] text-[var(--color-text-muted)]">Revoyez le guide interactif pour redécouvrir les fonctionnalités d'Extnd.</p>
                </div>
                <button
                    onClick={() => {
                        onCloseSettings();
                        setTimeout(() => {
                            import('../../tutorial').then(({ startTutorial }) => startTutorial(true));
                        }, 150);
                    }}
                    className="bg-[var(--color-drug)] text-white border-none py-3 px-6 rounded-xl font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 whitespace-nowrap hover:brightness-90 active:scale-95"
                >
                    <MagnifyingGlass size={16} /> Rejouer
                </button>
            </div>
        </div>
    );
};
