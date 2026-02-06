import { useState } from 'react';
import { Search, Pill, Stethoscope, Brain, BarChart2, Plus, X, FileText, Upload } from 'lucide-react';

interface HomePageProps {
    onSearch: (query: string) => void;
    onStartBrowsing: () => void;
    onAddCard: () => void;
    onBatchImport: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
    onSearch,
    onStartBrowsing,
    onAddCard,
    onBatchImport,
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
