import { useEffect, useState } from 'react';
import {
    MagnifyingGlass, Plus, X, UploadSimple, GearSix,
    BookOpen, Brain, SlidersHorizontal,
    FloppyDisk, Moon, Sun, Folders
} from '@phosphor-icons/react';
import type { Card } from '../types';
import { useTheme } from '../context/ThemeContext';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../persistentSettings';

type Workspace = { id: string; name: string; createdAt: number; updatedAt: number };

interface HomePageProps {
    cards: Card[];
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (id: string) => void;
    onNavigateToCard: (id: string) => void;
    onSearch: (query: string) => void;
    onStartBrowsing: () => void;
    onStartReviewSession?: () => void;
    onAddCard: () => void;
    onBatchImport: () => void;
    onBackgroundExport?: () => void;
    onSettings: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
    cards,
    workspaces,
    activeWorkspaceId,
    onWorkspaceChange,
    onNavigateToCard,
    onSearch,
    onStartBrowsing,
    onStartReviewSession,
    onAddCard,
    onBatchImport,
    onBackgroundExport,
    onSettings,
}) => {
    const { darkMode, toggleDarkMode } = useTheme();
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showWidgetSettings, setShowWidgetSettings] = useState(false);
    const [widgetPrefs, setWidgetPrefs] = useState(() =>
        loadSettingSync<Record<string, boolean>>('pharmabrain_home_widgets', { review: true, heatmap: true, recent: true })
    );

    useEffect(() => {
        loadSettingAsync<Record<string, boolean>>('pharmabrain_home_widgets', { review: true, heatmap: true, recent: true })
            .then(setWidgetPrefs);
    }, []);

    const dueCards = cards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const learningCards = cards.filter(c => c.progress?.status === 'learning' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const totalToReview = dueCards.length + learningCards.length;
    const newCards = cards.filter(c => !c.progress || c.progress.status === 'new');

    const recentCards = [...cards]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchValue.trim()) onSearch(searchValue.trim());
    };

    const handleAddSingle = () => { setShowFabMenu(false); onAddCard(); };
    const handleBatchImport = () => { setShowFabMenu(false); onBatchImport(); };
    const handleBackup = () => { setShowFabMenu(false); onBackgroundExport?.(); };

    const toggleWidget = (widget: string) => {
        setWidgetPrefs(prev => {
            const next = { ...prev, [widget]: !prev[widget] };
            saveSettingAsync('pharmabrain_home_widgets', next);
            return next;
        });
    };

    const typeCount = (type: string) => cards.filter(c => c.type === type).length;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className="home-page">
            <div className="home-animated-bg" />

            {/* Top bar */}
            <div className="home-topbar app-drag-region">
                <div className="home-topbar-actions app-no-drag" style={{marginLeft: 'auto'}}>
                    <button
                        className="home-topbar-btn"
                        onClick={toggleDarkMode}
                        title={darkMode ? 'Mode clair' : 'Mode sombre'}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    {onBackgroundExport && (
                        <button
                            className="home-topbar-btn"
                            onClick={onBackgroundExport}
                            title="Sauvegarde"
                        >
                            <FloppyDisk size={18} />
                        </button>
                    )}
                    <button
                        className="home-topbar-btn"
                        onClick={onBatchImport}
                        title="Import en masse"
                    >
                        <UploadSimple size={18} />
                    </button>
                    <button
                        className="home-topbar-btn"
                        onClick={onSettings}
                        title="Paramètres"
                    >
                        <GearSix size={18} />
                    </button>
                </div>
            </div>

            {/* Main Center Content */}
            <div className="home-content app-no-drag">
                <h1 className="home-greeting">
                    {getGreeting()}, <span>Pierrick</span>
                </h1>
                <p className="home-subtitle">Que souhaitez-vous explorer dans <strong>{workspaces.find(w => w.id === activeWorkspaceId)?.name || 'cet espace'}</strong> ?</p>

                {/* Search Bar (Omnibox) */}
                <form className="home-search" onSubmit={handleSubmit}>
                    <div className="home-search-box">
                        <MagnifyingGlass size={22} className="home-search-icon" weight="regular" />
                        <input
                            type="text"
                            name="search"
                            placeholder="Rechercher une fiche, une pathologie..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => setSearchValue('')}
                                className="home-search-clear"
                                title="Effacer"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Speed Dials */}
                <div className="home-speed-dials">
                    <button className={`speed-dial-btn action-review ${totalToReview > 0 ? 'is-urgent' : ''}`} onClick={onStartReviewSession || onStartBrowsing}>
                        <div className="speed-dial-icon-wrap">
                            <Brain size={28} weight={totalToReview > 0 ? "fill" : "duotone"} />
                            {totalToReview > 0 && <span className="speed-dial-badge">{totalToReview}</span>}
                        </div>
                        <span className="speed-dial-label">Révision</span>
                    </button>

                    <button className="speed-dial-btn action-browse" onClick={onStartBrowsing}>
                        <div className="speed-dial-icon-wrap">
                            <BookOpen size={28} weight="duotone" />
                        </div>
                        <span className="speed-dial-label">Parcourir</span>
                    </button>

                    <button className="speed-dial-btn action-add" onClick={onAddCard}>
                        <div className="speed-dial-icon-wrap">
                            <Plus size={28} weight="bold" />
                        </div>
                        <span className="speed-dial-label">Nouvelle</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
