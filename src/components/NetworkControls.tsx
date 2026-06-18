import { MagnifyingGlassPlus, MagnifyingGlassMinus, Crosshair, CornersOut, CornersIn } from '@phosphor-icons/react';

interface NetworkControlsProps {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleFitView: () => void;
    toggleFullscreen: () => void;
    isFullscreen: boolean;
    isDark: boolean;
    pendingClusterReview: boolean;
    hasSelectedNodes: boolean;
}

export function NetworkControls({
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    toggleFullscreen,
    isFullscreen,
    isDark,
    pendingClusterReview,
    hasSelectedNodes
}: NetworkControlsProps) {
    return (
        <div className={`absolute z-40 flex flex-col gap-2 transition-all duration-300 
            ${pendingClusterReview ? 'bottom-24 right-4 md:right-[390px]' : (hasSelectedNodes ? 'bottom-6 right-4 md:right-[374px]' : 'bottom-6 right-4 md:right-6')}`}>
            <button
                onClick={handleZoomIn}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md cursor-pointer
                    ${isDark 
                        ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                title="Zoom avant"
                aria-label="Zoom avant"
            >
                <MagnifyingGlassPlus size={20} />
            </button>
            <button
                onClick={handleZoomOut}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md cursor-pointer
                    ${isDark 
                        ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                title="Zoom arrière"
                aria-label="Zoom arrière"
            >
                <MagnifyingGlassMinus size={20} />
            </button>
            <button
                onClick={handleFitView}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md cursor-pointer
                    ${isDark 
                        ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                title="Recentrer la vue"
                aria-label="Recentrer la vue"
            >
                <Crosshair size={20} />
            </button>
            <button
                onClick={toggleFullscreen}
                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md cursor-pointer
                    ${isDark 
                        ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
                {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
            </button>
        </div>
    );
}
