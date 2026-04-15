import { useState } from 'react';
import { Search, Plus, X, FileText, Upload, Settings } from 'lucide-react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import type { Card } from '../types';

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
        return {
            review: true,
            heatmap: true,
            recent: true
        };
    });

    const dueCards = cards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const learningCards = cards.filter(c => c.progress?.status === 'learning' && c.progress.dueDate && new Date(c.progress.dueDate) <= new Date());
    const totalToReview = dueCards.length + learningCards.length;

    const recentCards = [...cards]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5);

    // Heatmap data: maps dates to count.
    const heatmapDataMap = new Map<string, number>();
    cards.forEach(c => {
        if (c.updatedAt) {
            // Using local string to group by day. Example format: YYYY-MM-DD
            const dateObj = new Date(c.updatedAt);
            const dateStr = dateObj.toISOString().split('T')[0];
            heatmapDataMap.set(dateStr, (heatmapDataMap.get(dateStr) || 0) + 1);
        }
    });

    const heatmapValues = Array.from(heatmapDataMap.entries()).map(([date, count]) => ({ date, count }));

    // Set heatmap range: Last 6 months to today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchValue.trim()) {
            onSearch(searchValue.trim());
        }
    };

    const handleAddSingle = () => {
        setShowFabMenu(false);
        onAddCard();
    };

    const handleBatchImport = () => {
        setShowFabMenu(false);
        onBatchImport();
    };

    const handleBackup = () => {
        setShowFabMenu(false);
        onBackgroundExport?.();
    };

    const toggleWidget = (widget: string) => {
        setWidgetPrefs(prev => {
            const next = { ...prev, [widget]: !prev[widget] };
            localStorage.setItem('pharmabrain_home_widgets', JSON.stringify(next));
            return next;
        });
    };

    return (
        <div className="home-page">
            <div className="home-animated-bg" />
            <div className="home-content">
                {/* Logo + Title grouped together */}
                <div className="home-branding app-drag-region">
                    <div className="logo-gradient-hero" />
                    <p className="home-subtitle">
                        Navigateur de connaissances pharmaceutiques
                    </p>
                </div>

                {/* Search centered */}
                <form className="home-search" onSubmit={handleSubmit}>
                    <div className="home-search-box">
                        <Search size={20} className="home-search-icon" />
                        <input
                            type="text"
                            name="search"
                            placeholder="Rechercher..."
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
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    borderRadius: '50%',
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="btn-primary home-search-btn">
                        Naviguer
                    </button>
                </form>

                <button className="home-browse-btn" onClick={onStartBrowsing}>
                    Parcourir toutes les fiches
                </button>
                <button className="home-browse-btn" onClick={() => setShowWidgetSettings(v => !v)} style={{ marginTop: '0.5rem' }}>
                    Personnaliser l'accueil
                </button>
                {showWidgetSettings && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button style={{ border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '999px', background: widgetPrefs.review ? '#dcfce7' : 'white' }} onClick={() => toggleWidget('review')}>Widget révision</button>
                        <button style={{ border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '999px', background: widgetPrefs.heatmap ? '#dcfce7' : 'white' }} onClick={() => toggleWidget('heatmap')}>Widget activité</button>
                        <button style={{ border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '999px', background: widgetPrefs.recent ? '#dcfce7' : 'white' }} onClick={() => toggleWidget('recent')}>Widget récents</button>
                    </div>
                )}

                {/* Categories on single row */}

                {/* 1. Dashboard Action */}
                <div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {widgetPrefs.review && (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Bonjour, vous avez {totalToReview} fiches à réviser aujourd'hui.</h2>
                            <button onClick={onStartReviewSession || onStartBrowsing} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                                Lancer la session
                            </button>
                        </div>
                    )}

                    {widgetPrefs.heatmap && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem', textAlign: 'center' }}>Activité (Derniers 6 mois)</h3>
                            <CalendarHeatmap
                                startDate={startDate}
                                endDate={endDate}
                                values={heatmapValues}
                                classForValue={(value: { count?: number } | undefined) => {
                                    if (!value) {
                                        return 'color-empty';
                                    }
                                    return 'color-scale-' + Math.min(value.count || 0, 4);
                                }}
                            />
                        </div>
                    )}

                    {widgetPrefs.recent && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Dernières fiches modifiées</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {recentCards.map(card => (
                                    <li key={card.id} onClick={() => onNavigateToCard(card.id)} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{card.title}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{card.type}</span>
                                    </li>
                                ))}
                                {recentCards.length === 0 && <li style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Aucune fiche récente.</li>}
                            </ul>
                        </div>
                    )}
                </div>

            </div>

            {/* Settings Button - Better integrated (subtle) */}
            <button
                onClick={onSettings}
                className="fixed top-6 right-6 z-50 p-2 text-slate-400/80 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-all duration-300"
                title="Paramètres"
                style={{}} // Removing inline styles
            >
                <Settings size={20} />
            </button>

            {/* Unified FAB with menu */}
            <div className="fab-container">
                {showFabMenu && (
                    <div className="fab-menu">
                        <button className="fab-menu-item" onClick={handleAddSingle}>
                            <FileText size={18} />
                            <span>Nouvelle fiche</span>
                        </button>
                        <button className="fab-menu-item" onClick={handleBatchImport}>
                            <Upload size={18} />
                            <span>Import en masse</span>
                        </button>
                        {onBackgroundExport && (
                            <button className="fab-menu-item" onClick={handleBackup}>
                                <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
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
