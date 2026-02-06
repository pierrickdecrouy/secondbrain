import { LayoutGrid, Share2, AlignJustify } from 'lucide-react';

export type ViewMode = 'grid' | 'network' | 'list';

interface ViewToggleProps {
    viewMode: ViewMode;
    onViewChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewChange }) => {
    return (
        <div className="view-toggle">
            <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewChange('grid')}
                title="Vue Grille"
            >
                <LayoutGrid size={18} />
                <span>Grille</span>
            </button>
            <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewChange('list')}
                title="Vue Liste"
            >
                <AlignJustify size={18} />
                <span>Liste</span>
            </button>
            <button
                className={`view-toggle-btn ${viewMode === 'network' ? 'active' : ''}`}
                onClick={() => onViewChange('network')}
                title="Vue Réseau"
            >
                <Share2 size={18} />
                <span>Réseau</span>
            </button>
        </div>
    );
};
