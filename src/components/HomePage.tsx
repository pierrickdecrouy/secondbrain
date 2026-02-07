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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        if (query.trim()) {
            onSearch(query.trim());
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
                            autoFocus
                            autoComplete="off"
                        />
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

            {/* Settings Button - Fixed to viewport */}
            <button
                onClick={onSettings}
                className="fixed top-6 right-6 z-[100] p-3.5 bg-white/90 backdrop-blur-md text-slate-400 hover:text-slate-700 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-200 group"
                title="Paramètres"
                style={{ position: 'fixed', top: '24px', right: '24px' }}
            >
                <Settings size={24} className="group-hover:rotate-45 transition-transform duration-500 ease-out" />
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
