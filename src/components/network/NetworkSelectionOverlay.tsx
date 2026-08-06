import React from 'react';
import { Lightning } from '@phosphor-icons/react';
import type { GraphLink } from '../NetworkGraphTypes';
import { linkEndpointId } from '../NetworkGraphTypes';

interface NetworkSelectionOverlayProps {
    selectedNodes: Set<string>;
    pathLinks: Set<string>;
    isDark: boolean;
    pendingClusterReview?: boolean;
    structuralDataLinks: GraphLink[];
    onClearSelection: () => void;
    onNodeClick?: (id: string) => void;
    onStartClusterReview?: (clusterNodeIds: string[]) => void;
}

export const NetworkSelectionOverlay: React.FC<NetworkSelectionOverlayProps> = ({
    selectedNodes,
    pathLinks,
    isDark,
    pendingClusterReview,
    structuralDataLinks,
    onClearSelection,
    onNodeClick,
    onStartClusterReview
}) => {
    if (selectedNodes.size === 0) return null;

    return (
        <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
            <div className={`backdrop-blur-md border rounded-xl p-4 flex flex-col gap-3 min-w-[240px] animate-in zoom-in-95 duration-200
                ${isDark
                    ? 'bg-slate-800/95 border-slate-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                    : 'bg-white/95 border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'}`}>
                <div className="flex items-center justify-between">
                    <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                            ${isDark ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                            {selectedNodes.size}
                        </span>
                        éléments
                    </span>
                    <button
                        className={`text-xs transition-colors border-none bg-transparent cursor-pointer outline-none ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={onClearSelection}
                    >
                        Tout effacer
                    </button>
                </div>

                {selectedNodes.size === 2 && (
                    <div className={`
                        text-xs px-3 py-2 rounded-lg border flex items-center gap-2
                        ${pathLinks.size > 0
                            ? isDark ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : isDark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}
                    `}>
                        {pathLinks.size > 0 ? (
                            <>
                                <Lightning size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                                <span>Chemin optimal (Dijkstra)</span>
                            </>
                        ) : (
                            <span>Aucune connexion directe</span>
                        )}
                    </div>
                )}
                
                {selectedNodes.size === 1 && pendingClusterReview && (
                    <button
                        onClick={() => {
                            const nodeId = Array.from(selectedNodes)[0];
                            const neighborIds = new Set<string>();
                            neighborIds.add(nodeId);
                            structuralDataLinks.forEach((l: GraphLink) => {
                                if (linkEndpointId(l.source) === nodeId) neighborIds.add(linkEndpointId(l.target));
                                if (linkEndpointId(l.target) === nodeId) neighborIds.add(linkEndpointId(l.source));
                            });
                            if (onStartClusterReview) {
                                onStartClusterReview(Array.from(neighborIds));
                            }
                        }}
                        className={`
                            w-full py-2 px-3 mt-2 rounded-lg font-bold text-sm transition-all shadow-sm border-none cursor-pointer outline-none
                            ${isDark 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            }
                        `}
                    >
                        Réviser ce cluster (manuel)
                    </button>
                )}

                {selectedNodes.size === 1 && (
                    <button
                        onClick={() => onNodeClick?.(Array.from(selectedNodes)[0])}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border-none cursor-pointer outline-none w-full
                            ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        Voir Détails
                    </button>
                )}
            </div>
        </div>
    );
};
