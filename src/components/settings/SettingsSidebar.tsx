import React from 'react';
import { BookOpen, ChartLine, Palette, Database, Brain, Timer } from '@phosphor-icons/react';

export type SettingsTab = 'dictionary' | 'stats' | 'general' | 'data' | 'intelligence' | 'revision';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
    return (
        <aside className="w-full md:w-[260px] bg-[var(--color-bg)] border-b md:border-b-0 md:border-r border-[var(--color-border)] py-5 px-5 md:py-7 md:px-5 flex flex-col">
            <div className="text-xl font-bold mb-1 text-[var(--color-text)]">Paramètres</div>
            <div className="text-xs text-[var(--color-text-muted)] mb-10">Extnd.</div>

            <ul className="list-none flex flex-col gap-2 p-0 m-0">
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'dictionary' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('dictionary')}
                >
                    <BookOpen size={18} className="mr-3 w-5 text-center" /> Dictionnaire
                </li>
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'stats' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('stats')}
                >
                    <ChartLine size={18} className="mr-3 w-5 text-center" /> Statistiques
                </li>
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'general' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('general')}
                >
                    <Palette size={18} className="mr-3 w-5 text-center" /> Apparence
                </li>
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'data' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('data')}
                >
                    <Database size={18} className="mr-3 w-5 text-center" /> Données
                </li>
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'intelligence' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('intelligence')}
                >
                    <Brain size={18} className="mr-3 w-5 text-center" /> Intelligence
                </li>
                <li
                    className={`flex items-center px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 ${activeTab === 'revision' ? 'bg-[var(--color-surface)] text-[var(--color-drug)] shadow-[0_4px_15px_rgba(0,0,0,0.05)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'}`}
                    onClick={() => onTabChange('revision')}
                >
                    <Timer size={18} className="mr-3 w-5 text-center" /> Révision
                </li>
            </ul>
        </aside>
    );
};
