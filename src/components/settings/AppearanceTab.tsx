import React from 'react';
import { MagnifyingGlass, ArrowCounterClockwise, Monitor, Moon, Sun } from '@phosphor-icons/react';
import { DynamicIcon, AVAILABLE_ICONS } from '../DynamicIcon';
import { useTheme } from '../../context/ThemeContext';
import { COURSE_TYPE } from '../../types';
import { useCardStore as useCards } from '../../store/useCardStore';
import { S, SettingsCard, CardSection, CardBody, SectionHeading, GhostButton, PrimaryButton } from './SettingsUI';
import { useTranslation } from 'react-i18next';
import './styles/AppearanceTab.css';

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
            className="appearancetab-style-1" style={{
  background: active ? S.primaryDim : 'transparent',
  border: `1.5px solid ${active ? S.primary : S.border}`,
  color: active ? S.primary : S.muted
}}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = S.muted; e.currentTarget.style.color = S.text; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; } }}
        >
            <div style={{ color: active ? S.primary : S.text }}>{icon}</div>
            <span className="appearancetab-style-2" style={{
  fontWeight: active ? 600 : 500
}}>{label}</span>
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
        <div className="appearancetab-style-3" >
            {/* Theme */}
            <SettingsCard>
                <CardSection title={t('settings.theme')} subtitle="Apparence globale de l'interface." />
                <CardBody>
                    <div className="appearancetab-style-4" >
                        <ThemeOption mode="light" label={t('settings.light')} icon={<Sun size={24} />} themeMode={themeMode} setThemeMode={setThemeMode} />
                        <ThemeOption mode="dark" label={t('settings.dark')} icon={<Moon size={24} />} themeMode={themeMode} setThemeMode={setThemeMode} />
                        <ThemeOption mode="system" label={t('settings.system')} icon={<Monitor size={24} />} themeMode={themeMode} setThemeMode={setThemeMode} />
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Language */}
            <SettingsCard>
                <CardSection title={t('settings.language')} subtitle="Langue de l'application." />
                <CardBody>
                    <div className="appearancetab-style-5" >
                        <button
                            onClick={() => i18n.changeLanguage('fr')}
                            className="appearancetab-style-6" style={{
  background: i18n.language.startsWith('fr') ? S.primaryDim : 'transparent',
  border: `1.5px solid ${i18n.language.startsWith('fr') ? S.primary : S.border}`,
  color: i18n.language.startsWith('fr') ? S.primary : S.muted
}}
                        >
                            <span className="appearancetab-style-7" >{t('settings.lang_fr')}</span>
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className="appearancetab-style-8" style={{
  background: i18n.language.startsWith('en') ? S.primaryDim : 'transparent',
  border: `1.5px solid ${i18n.language.startsWith('en') ? S.primary : S.border}`,
  color: i18n.language.startsWith('en') ? S.primary : S.muted
}}
                        >
                            <span className="appearancetab-style-9" >{t('settings.lang_en')}</span>
                        </button>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Categories & Colors */}
            <div>
                <div className="appearancetab-style-10" >
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

                <div className="appearancetab-style-11" >
                    {categoriesToDisplay.map(type => (
                        <SettingsCard key={type}>
                            <CardBody>
                                {/* Preview header */}
                                <div className="appearancetab-style-12" >
                                    <div className="appearancetab-style-13" style={{
  background: getCategoryColor(type)
}}>
                                        <DynamicIcon name={categoryIcons[type]} size={20} />
                                    </div>
                                    <span className="appearancetab-style-14" style={{
  color: S.text
}}>
                                        {categoryLabels[type] || type}
                                    </span>
                                </div>

                                {/* Color */}
                                <div className="appearancetab-style-15" >
                                    <div className="appearancetab-style-16" style={{
  color: S.muted
}}>
                                        Couleur
                                    </div>
                                    <div className="appearancetab-style-17" >
                                        <div className="appearancetab-style-18" >
                                            <input
                                                type="color"
                                                value={getCategoryColor(type)}
                                                onChange={e => setCategoryColor(type, e.target.value)}
                                                className="appearancetab-style-19" 
                                            />
                                            <div className="appearancetab-style-20" style={{
  background: getCategoryColor(type),
  border: `2px solid ${S.border}`
}} />
                                        </div>
                                        <input
                                            type="text"
                                            value={getCategoryColor(type)}
                                            onChange={e => setCategoryColor(type, e.target.value)}
                                            className="appearancetab-style-21" style={{
  border: `1px solid ${S.border}`,
  color: S.text,
  background: S.bg
}}
                                        />
                                    </div>
                                </div>

                                {/* Icons */}
                                <div>
                                    <div className="appearancetab-style-22" style={{
  color: S.muted
}}>
                                        Icône
                                    </div>
                                    <div className="appearancetab-style-23" >
                                        {AVAILABLE_ICONS.map(iconName => {
                                            const active = getCategoryIcon(type) === iconName;
                                            const color = getCategoryColor(type);
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setCategoryIcon(type, iconName)}
                                                    title={iconName}
                                                    className="appearancetab-style-24" style={{
  border: active ? `1.5px solid ${color}` : `1px solid ${S.border}`,
  background: active ? `${color}18` : 'transparent',
  color: active ? color : S.muted
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
                <CardBody className="appearancetab-style-25" >
                    <div>
                        <div className="appearancetab-style-26" style={{
  color: S.text
}}>Tutoriel interactif</div>
                        <div className="appearancetab-style-27" style={{
  color: S.muted
}}>
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
