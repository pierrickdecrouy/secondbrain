import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import type { CardType } from '../types';

interface OmniboxProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeFilters: CardType[];
    onFilterToggle: (type: CardType) => void;
}

export const Omnibox: React.FC<OmniboxProps> = ({
    searchQuery,
    onSearchChange,
    activeFilters,
    onFilterToggle
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

    const filters: { type: CardType; label: string }[] = [
        { type: 'drug', label: 'Médicaments' },
        { type: 'patho', label: 'Pathologies' },
        { type: 'physio', label: 'Physiologie' },
        { type: 'data', label: 'Données' },
    ];

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
                />
                <kbd className="search-kbd">⌘K</kbd>
            </div>

            <div className="filter-buttons">
                {filters.map((f) => (
                    <button
                        key={f.type}
                        data-type={f.type}
                        onClick={() => onFilterToggle(f.type)}
                        className={`filter-btn ${activeFilters.includes(f.type) ? 'active' : ''}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
