import React from 'react';
import { MagnifyingGlass, ArrowCounterClockwise, Monitor, Moon, Sun } from '@phosphor-icons/react';
import { DynamicIcon, AVAILABLE_ICONS } from '../DynamicIcon';
import { useTheme } from '../../context/ThemeContext';
import { COURSE_TYPE } from '../../types';
import { useCardStore as useCards } from '../../store/useCardStore';
import { SettingsCard, CardSection, CardBody, SectionHeading, GhostButton, PrimaryButton } from './SettingsUI';
import { useTranslation } from 'react-i18next';

interface AppearanceTabProps {
    onCloseSettings: () => void;
}

const ThemeOption: React.FC<{
    mode: 'light' | 'dark' | 'system';
    label: string;
    icon: React.ReactNode;
    themeMode: 'light' | 'dark' | 'system';
    setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}> = ({ mode, label, icon, themeMode, setThemeMode }) => {
    const active = themeMode === mode;
    return (
        <button
            onClick={() => setThemeMode(mode)}
            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                active 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
        >
            <div className={`${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {icon}
            </div>
            <span className={`text-sm ${active ? 'font-bold' : 'font-semibold'}`}>
                {label}
            </span>
        </button>
    );
};

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ onCloseSettings }) => {
    const { t, i18n } = useTranslation();
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

    return (
        <div className="flex flex-col gap-6">
            {/* Theme */}
            <SettingsCard>
                <CardSection title={t('settings.theme')} subtitle="Apparence globale de l'interface." />
                <CardBody>
                    <div className="grid grid-cols-3 gap-4">
                        <ThemeOption mode="light" label={t('settings.light')} icon={<Sun size={28} weight="duotone" />} themeMode={themeMode} setThemeMode={setThemeMode} />
                        <ThemeOption mode="dark" label={t('settings.dark')} icon={<Moon size={28} weight="duotone" />} themeMode={themeMode} setThemeMode={setThemeMode} />
                        <ThemeOption mode="system" label={t('settings.system')} icon={<Monitor size={28} weight="duotone" />} themeMode={themeMode} setThemeMode={setThemeMode} />
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Language */}
            <SettingsCard>
                <CardSection title={t('settings.language')} subtitle="Langue de l'application." />
                <CardBody>
                    <div className="flex gap-4">
                        <button
                            onClick={() => i18n.changeLanguage('fr')}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                                i18n.language.startsWith('fr')
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                    : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            {t('settings.lang_fr')}
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                                i18n.language.startsWith('en')
                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                    : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            {t('settings.lang_en')}
                        </button>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Categories & Colors */}
            <div>
                <div className="flex items-center justify-between mb-4">
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
                        <ArrowCounterClockwise size={16} weight="bold" /> Restaurer
                    </GhostButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoriesToDisplay.map(type => (
                        <SettingsCard key={type}>
                            <CardBody className="flex flex-col gap-5">
                                {/* Preview header */}
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm"
                                        style={{ background: getCategoryColor(type) }}
                                    >
                                        <DynamicIcon name={categoryIcons[type]} size={20} />
                                    </div>
                                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        {categoryLabels[type] || type}
                                    </span>
                                </div>

                                {/* Color */}
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                        Couleur
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 shrink-0">
                                            <input
                                                type="color"
                                                value={getCategoryColor(type)}
                                                onChange={e => setCategoryColor(type, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div 
                                                className="absolute inset-0 rounded-lg border border-slate-200 dark:border-slate-700 pointer-events-none shadow-sm"
                                                style={{ background: getCategoryColor(type) }} 
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={getCategoryColor(type)}
                                            onChange={e => setCategoryColor(type, e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Icons */}
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                        Icône
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_ICONS.map(iconName => {
                                            const active = getCategoryIcon(type) === iconName;
                                            const color = getCategoryColor(type);
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setCategoryIcon(type, iconName)}
                                                    title={iconName}
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                                    style={{
                                                        border: active ? `2px solid ${color}` : `1px solid transparent`,
                                                        background: active ? `${color}15` : 'transparent',
                                                        color: active ? color : 'currentColor'
                                                    }}
                                                >
                                                    <span className={active ? '' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}>
                                                        <DynamicIcon name={iconName} size={18} />
                                                    </span>
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
                <CardBody className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Tutoriel interactif</div>
                        <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                            Redécouvrez les fonctionnalités principales d'Extnd pas à pas.
                        </div>
                    </div>
                    <PrimaryButton onClick={() => {
                        onCloseSettings();
                        setTimeout(() => {
                            import('../../tutorial').then(({ startTutorial }) => startTutorial(true));
                        }, 150);
                    }}>
                        <MagnifyingGlass size={16} weight="bold" /> Rejouer
                    </PrimaryButton>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
