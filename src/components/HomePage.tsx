import { useState } from 'react';
import {
    MagnifyingGlass, Plus, X, FileText, UploadSimple, GearSix,
    BookOpen, Brain, Lightning, ArrowRight, SlidersHorizontal,
    FloppyDisk, Books, Clock
} from '@phosphor-icons/react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import type { Card } from '../types';

interface HeatmapValue {
    count?: number;
}

const hasHeatmapCount = (value: unknown): value is HeatmapValue => {
    return typeof value === 'object' && value !== null && 'count' in value;
};

interface HomePageProps {
    cards: Card[];
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
    onNavigateToCard,
    onSearch,
    onStartBrowsing,
    onStartReviewSession,
    onAddCard,
    onBatchImport,
    onBackgroundExport,
    onSettings,
}) => {
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showWidgetSettings, setShowWidgetSettings] = useState(false);
    const [widgetPrefs, setWidgetPrefs] = useState(() => {
        const raw = localStorage.getItem('pharmabrain_home_widgets');
        if (raw) {
            try {
                return JSON.parse(raw) as Record<string, boolean>;
            } catch {
                // noop
            }
        }
        return { review: true, heatmap: true, recent: true };
    });

    const dueCards = cards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const learningCards = cards.filter(c => c.progress?.status === 'learning' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const totalToReview = dueCards.length + learningCards.length;
    const newCards = cards.filter(c => !c.progress || c.progress.status === 'new');

    const recentCards = [...cards]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5);

    const heatmapDataMap = new Map<string, number>();
    cards.forEach(c => {
        if (c.updatedAt) {
            const dateStr = new Date(c.updatedAt).toISOString().split('T')[0];
            heatmapDataMap.set(dateStr, (heatmapDataMap.get(dateStr) || 0) + 1);
        }
    });
    const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

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
            localStorage.setItem('pharmabrain_home_widgets', JSON.stringify(next));
            return next;
        });
    };

    const typeCount = (type: string) => cards.filter(c => c.type === type).length;

    return (
        <div className="home-page">
            <div className="home-animated-bg" />

            {/* Top bar */}
            <div className="home-topbar app-drag-region">
                <div className="home-topbar-logo">
                    <div className="logo-gradient-small" />
                    <span className="home-topbar-name">PharmaBrain</span>
                </div>
                <div className="home-topbar-actions app-no-drag">
                    <button
                        className="home-topbar-btn"
                        onClick={() => setShowWidgetSettings(v => !v)}
                        title="Personnaliser"
                    >
                        <SlidersHorizontal size={18} />
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

            <div className="home-content">
                {/* Hero */}
                <div className="home-hero">
                    <div className="logo-gradient-hero" />
                    <p className="home-subtitle">Navigateur de connaissances pharmaceutiques</p>
                </div>

                {/* Search */}
                <form className="home-search" onSubmit={handleSubmit}>
                    <div className="home-search-box">
                        <MagnifyingGlass size={20} className="home-search-icon" weight="regular" />
                        <input
                            type="text"
                            name="search"
                            placeholder="Rechercher une fiche, un concept..."
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
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="btn-primary home-search-btn">
                        Naviguer
                        <ArrowRight size={16} />
                    </button>
                </form>

                {/* Quick stats row */}
                <div className="home-stats-row">
                    <div className="home-stat-card">
                        <Books size={20} weight="duotone" className="home-stat-icon icon-total" />
                        <div className="home-stat-body">
                            <span className="home-stat-value">{cards.length}</span>
                            <span className="home-stat-label">Fiches</span>
                        </div>
                    </div>
                    <div className="home-stat-card home-stat-card--urgent" onClick={onStartReviewSession || onStartBrowsing} style={{ cursor: totalToReview > 0 ? 'pointer' : 'default' }}>
                        <Clock size={20} weight="duotone" className="home-stat-icon icon-review" />
                        <div className="home-stat-body">
                            <span className="home-stat-value">{totalToReview}</span>
                            <span className="home-stat-label">À réviser</span>
                        </div>
                        {totalToReview > 0 && <ArrowRight size={14} className="home-stat-arrow" />}
                    </div>
                    <div className="home-stat-card">
                        <Brain size={20} weight="duotone" className="home-stat-icon icon-new" />
                        <div className="home-stat-body">
                            <span className="home-stat-value">{newCards.length}</span>
                            <span className="home-stat-label">Nouvelles</span>
                        </div>
                    </div>
                    <div className="home-stat-card">
                        <Lightning size={20} weight="duotone" className="home-stat-icon icon-learning" />
                        <div className="home-stat-body">
                            <span className="home-stat-value">{learningCards.length}</span>
                            <span className="home-stat-label">En cours</span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="home-actions-row">
                    <button className="home-action-btn home-action-btn--primary" onClick={onStartReviewSession || onStartBrowsing}>
                        <Brain size={18} weight="duotone" />
                        <span>Réviser</span>
                    </button>
                    <button className="home-action-btn" onClick={onStartBrowsing}>
                        <BookOpen size={18} weight="duotone" />
                        <span>Parcourir</span>
                    </button>
                    <button className="home-action-btn" onClick={onAddCard}>
                        <Plus size={18} />
                        <span>Nouvelle fiche</span>
                    </button>
                </div>

                {/* Category pills */}
                <div className="home-category-pills">
                    {[
                        { type: 'drug', label: 'Médicaments', color: 'drug' },
                        { type: 'patho', label: 'Pathologies', color: 'patho' },
                        { type: 'physio', label: 'Physiologie', color: 'physio' },
                        { type: 'data', label: 'Données', color: 'data' },
                    ].map(({ type, label, color }) => (
                        typeCount(type) > 0 && (
                            <button
                                key={type}
                                className={`home-category-pill category-${color}`}
                                onClick={() => onSearch(type)}
                            >
                                {label}
                                <span className="home-pill-count">{typeCount(type)}</span>
                            </button>
                        )
                    ))}
                </div>

                {/* Widgets */}
                {showWidgetSettings && (
                    <div className="home-widget-settings">
                        <span className="home-widget-settings-label">Widgets visibles :</span>
                        {[
                            { key: 'review', label: 'Révision' },
                            { key: 'heatmap', label: 'Activité' },
                            { key: 'recent', label: 'Récents' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                className={`home-widget-toggle ${widgetPrefs[key] ? 'active' : ''}`}
                                onClick={() => toggleWidget(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="home-widgets">
                    {widgetPrefs.review && (
                        <div className="home-widget home-widget--review">
                            <div className="home-widget-header">
                                <Brain size={16} weight="duotone" />
                                <span>Session du jour</span>
                            </div>
                            {totalToReview > 0 ? (
                                <>
                                    <p className="home-widget-text">
                                        <strong>{totalToReview}</strong> fiche{totalToReview > 1 ? 's' : ''} à réviser aujourd'hui
                                    </p>
                                    <button
                                        className="home-widget-cta"
                                        onClick={onStartReviewSession || onStartBrowsing}
                                    >
                                        <Lightning size={15} weight="fill" />
                                        Lancer la session
                                    </button>
                                </>
                            ) : (
                                <p className="home-widget-text home-widget-text--success">
                                    ✓ Tout est à jour — bravo !
                                </p>
                            )}
                        </div>
                    )}

                    {widgetPrefs.heatmap && (
                        <div className="home-widget home-widget--heatmap">
                            <div className="home-widget-header">
                                <Lightning size={16} weight="duotone" />
                                <span>Activité (6 derniers mois)</span>
                            </div>
                            <div className="home-heatmap-wrap">
                                <CalendarHeatmap
                                    startDate={startDate}
                                    endDate={endDate}
                                    values={heatmapValues}
                                    classForValue={(value) => {
                                        if (!value) return 'color-empty';
                                        const count = hasHeatmapCount(value) ? value.count || 0 : 0;
                                        return 'color-scale-' + Math.min(count, 4);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {widgetPrefs.recent && (
                        <div className="home-widget home-widget--recent">
                            <div className="home-widget-header">
                                <Clock size={16} weight="duotone" />
                                <span>Récemment modifiées</span>
                            </div>
                            <ul className="home-recent-list">
                                {recentCards.map(card => (
                                    <li
                                        key={card.id}
                                        className="home-recent-item"
                                        onClick={() => onNavigateToCard(card.id)}
                                    >
                                        <span className="home-recent-title">{card.title}</span>
                                        <span className={`home-recent-badge badge-${card.type}`}>{card.type}</span>
                                    </li>
                                ))}
                                {recentCards.length === 0 && (
                                    <li className="home-recent-empty">Aucune fiche pour le moment.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

            </div>

            {/* FAB */}
            <div className="fab-container">
                {showFabMenu && (
                    <div className="fab-menu">
                        <button className="fab-menu-item" onClick={handleAddSingle}>
                            <FileText size={18} />
                            <span>Nouvelle fiche</span>
                        </button>
                        <button className="fab-menu-item" onClick={handleBatchImport}>
                            <UploadSimple size={18} />
                            <span>Import en masse</span>
                        </button>
                        {onBackgroundExport && (
                            <button className="fab-menu-item" onClick={handleBackup}>
                                <FloppyDisk size={18} />
                                <span>Sauvegarde</span>
                            </button>
                        )}
                    </div>
                )}
                <button
                    className={`fab-main ${showFabMenu ? 'fab-open' : ''}`}
                    onClick={() => setShowFabMenu(!showFabMenu)}
                    title="Ajouter"
                >
                    {showFabMenu ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>
        </div>
    );
};
