import React from 'react';
import { BookOpen, ChartLine, Palette, Database, Brain, Timer } from '@phosphor-icons/react';

export type SettingsTab = 'dictionary' | 'stats' | 'general' | 'data' | 'intelligence' | 'revision';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-title">Paramètres</div>
            <div className="sidebar-version">Extnd.</div>

            <ul className="nav-menu">
                <li
                    className={`nav-item ${activeTab === 'dictionary' ? 'active' : ''}`}
                    onClick={() => onTabChange('dictionary')}
                >
                    <BookOpen size={18} /> Dictionnaire
                </li>
                <li
                    className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => onTabChange('stats')}
                >
                    <ChartLine size={18} /> Statistiques
                </li>
                <li
                    className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => onTabChange('general')}
                >
                    <Palette size={18} /> Apparence
                </li>
                <li
                    className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => onTabChange('data')}
                >
                    <Database size={18} /> Données
                </li>
                <li
                    className={`nav-item ${activeTab === 'intelligence' ? 'active' : ''}`}
                    onClick={() => onTabChange('intelligence')}
                >
                    <Brain size={18} /> Intelligence
                </li>
                <li
                    className={`nav-item ${activeTab === 'revision' ? 'active' : ''}`}
                    onClick={() => onTabChange('revision')}
                >
                    <Timer size={18} /> Révision
                </li>
            </ul>
        </aside>
    );
};
