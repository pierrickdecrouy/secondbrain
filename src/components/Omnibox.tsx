import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface OmniboxProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeFilters: string[];
    onFilterToggle: (type: string) => void;
    availableTypes: string[];
}

export const Omnibox: React.FC<OmniboxProps> = ({
    searchQuery,
    onSearchChange,
    activeFilters,
    onFilterToggle,
    availableTypes
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // If no types available yet, show defaults or empty? 
    // Let's show defaults if empty, or just what's passed.
    // Actually, App.tsx should pass defaults + existing.
    // For now, let's just use what's passed.

    // Helper to prettify labels if they match known types, else Title Case
    const getLabel = (type: string) => {
        const known: Record<string, string> = {
            drug: 'Médicaments',
            patho: 'Pathologies',
            physio: 'Physiologie',
            data: 'Données'
        };
        return known[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <div className="omnibox">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ paddingRight: searchQuery ? '60px' : '40px' }} // Make room for clear button + Kbd
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            onSearchChange('');
                            inputRef.current?.focus();
                        }}
                        className="search-clear-btn"
                        style={{
                            position: 'absolute',
                            right: '36px', // Left of Kbd
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
                            borderRadius: '50%',
                        }}
                        title="Effacer"
                    >
                        <X size={16} />
                    </button>
                )}
                <kbd className="search-kbd">⌘K</kbd>
            </div>

            <div className="filter-buttons">
                {availableTypes.map((type) => (
                    <button
                        key={type}
                        data-type={type}
                        onClick={() => onFilterToggle(type)}
                        className={`filter-btn ${activeFilters.includes(type) ? 'active' : ''}`}
                    >
                        {getLabel(type)}
                    </button>
                ))}
            </div>
        </div>
    );
};
