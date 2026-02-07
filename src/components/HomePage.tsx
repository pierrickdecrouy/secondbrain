import { useState } from 'react';
import { Search, Pill, Stethoscope, Brain, BarChart2, Plus, X, FileText, Upload, Settings } from 'lucide-react';

interface HomePageProps {
    onSearch: (query: string) => void;
    onStartBrowsing: () => void;
    onAddCard: () => void;
    onBatchImport: () => void;
    onBackgroundExport?: () => void;
    onSettings: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
    onSearch,
    onStartBrowsing,
    onAddCard,
    onBatchImport,
    onBackgroundExport,
    onSettings,
}) => {
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [searchValue, setSearchValue] = useState('');

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

    return (
        <div className="home-page">
            <div className="home-content">
                {/* Logo + Title grouped together */}
                <div className="home-branding">
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
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: 8,
                                    marginRight: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
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

                {/* Categories on single row */}
                <div className="home-categories">
                    <div className="category-item category-drug">
                        <Pill size={20} />
                        <span>Médicaments</span>
                    </div>
                    <div className="category-item category-patho">
                        <Stethoscope size={20} />
                        <span>Pathologies</span>
                    </div>
                    <div className="category-item category-physio">
                        <Brain size={20} />
                        <span>Physiologie</span>
                    </div>
                    <div className="category-item category-data">
                        <BarChart2 size={20} />
                        <span>Données</span>
                    </div>
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
