import React from 'react';
import { MagnifyingGlass, ArrowCounterClockwise, Monitor, Moon, Sun } from '@phosphor-icons/react';
import { DynamicIcon, AVAILABLE_ICONS } from '../DynamicIcon';
import { useTheme } from '../../context/ThemeContext';
import { COURSE_TYPE } from '../../types';
import { useCardStore as useCards } from '../../store/useCardStore';
import { S, SettingsCard, CardSection, CardBody, SectionHeading, GhostButton, PrimaryButton } from './SettingsUI';

interface AppearanceTabProps {
    onCloseSettings: () => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ onCloseSettings }) => {
    const { cards } = useCards();
    const availableCategories = Array.from(new Set(cards.map(c => c.type))).filter(t => t !== COURSE_TYPE).sort();

    const {
        categoryColors, categoryIcons,
        setCategoryColor, setCategoryIcon,
        resetCategoryColors, resetCategoryIcons,
        getCategoryColor, getCategoryIcon,
        themeMode, setThemeMode,
    } = useTheme();

    const categoryLabels: Record<string, string> = {
        drug: 'Médicaments', patho: 'Pathologies',
        physio: 'Physiologie', data: 'Données',
    };

    const categoriesToDisplay = Array.from(new Set([
        ...Object.keys(categoryColors),
        ...availableCategories,
    ])).sort();

    // Theme option button
    const ThemeOption: React.FC<{ mode: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }> = ({ mode, label, icon }) => {
        const active = themeMode === mode;
        return (
            <button
                onClick={() => setThemeMode(mode)}
                style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '14px 12px',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active ? S.primaryDim : 'transparent',
                    border: `1.5px solid ${active ? S.primary : S.border}`,
                    color: active ? S.primary : S.muted,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = S.muted; e.currentTarget.style.color = S.text; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; } }}
            >
                {icon}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            </button>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Theme */}
            <SettingsCard>
                <CardSection title="Thème" subtitle="Apparence globale de l'interface." />
                <CardBody>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <ThemeOption mode="light" label="Clair" icon={<Sun size={24} />} />
                        <ThemeOption mode="dark" label="Sombre" icon={<Moon size={24} />} />
                        <ThemeOption mode="system" label="Système" icon={<Monitor size={24} />} />
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Categories & Colors */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <SectionHeading
                        title="Catégories & Couleurs"
                        subtitle="Personnalisez l'apparence de chaque type de fiche."
                    />
                    <GhostButton small onClick={() => {
                        if (confirm('Restaurer les couleurs et icônes par défaut ?')) {
                            resetCategoryColors();
                            resetCategoryIcons();
                        }
                    }}>
                        <ArrowCounterClockwise size={14} /> Restaurer
                    </GhostButton>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {categoriesToDisplay.map(type => (
                        <SettingsCard key={type}>
                            <CardBody>
                                {/* Preview header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: getCategoryColor(type),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', flexShrink: 0,
                                    }}>
                                        <DynamicIcon name={categoryIcons[type]} size={20} />
                                    </div>
                                    <span style={{ fontWeight: 600, color: S.text, fontSize: 15 }}>
                                        {categoryLabels[type] || type}
                                    </span>
                                </div>

                                {/* Color */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                        Couleur
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                                            <input
                                                type="color"
                                                value={getCategoryColor(type)}
                                                onChange={e => setCategoryColor(type, e.target.value)}
                                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', border: 'none', borderRadius: 8 }}
                                            />
                                            <div style={{
                                                width: '100%', height: '100%',
                                                background: getCategoryColor(type),
                                                borderRadius: 8,
                                                border: `2px solid ${S.border}`,
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                            }} />
                                        </div>
                                        <input
                                            type="text"
                                            value={getCategoryColor(type)}
                                            onChange={e => setCategoryColor(type, e.target.value)}
                                            style={{
                                                flex: 1, padding: '7px 12px',
                                                border: `1px solid ${S.border}`,
                                                borderRadius: 8, fontSize: 13,
                                                color: S.text, fontFamily: 'monospace',
                                                background: S.bg, outline: 'none',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Icons */}
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                        Icône
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {AVAILABLE_ICONS.map(iconName => {
                                            const active = getCategoryIcon(type) === iconName;
                                            const color = getCategoryColor(type);
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setCategoryIcon(type, iconName)}
                                                    title={iconName}
                                                    style={{
                                                        border: active ? `1.5px solid ${color}` : `1px solid ${S.border}`,
                                                        background: active ? `${color}18` : 'transparent',
                                                        color: active ? color : S.muted,
                                                        width: 34, height: 34,
                                                        borderRadius: 8,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <DynamicIcon name={iconName} size={17} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardBody>
                        </SettingsCard>
                    ))}
                </div>
            </div>

            {/* Tutorial */}
            <SettingsCard>
                <CardBody style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: S.text, marginBottom: 4 }}>Tutoriel interactif</div>
                        <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.5 }}>
                            Redécouvrez les fonctionnalités principales d'Extnd pas à pas.
                        </div>
                    </div>
                    <PrimaryButton onClick={() => {
                        onCloseSettings();
                        setTimeout(() => {
                            import('../../tutorial').then(({ startTutorial }) => startTutorial(true));
                        }, 150);
                    }}>
                        <MagnifyingGlass size={15} /> Rejouer
                    </PrimaryButton>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
