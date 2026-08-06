import React from 'react';
import type { ClusterInfo } from '../../utils/clustering';

interface NetworkClustersOverlayProps {
    clusters: ClusterInfo[];
    isDark: boolean;
    onStartClusterReview?: (clusterNodeIds: string[]) => void;
    getClusterColor: (clusterId: string) => string;
}

export const NetworkClustersOverlay: React.FC<NetworkClustersOverlayProps> = ({
    clusters,
    isDark,
    onStartClusterReview,
    getClusterColor
}) => {
    return (
        <div className={`absolute z-20 flex flex-col gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in slide-in-from-right-8 duration-300
            bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100%-2rem)] md:w-[350px] max-h-[60vh]
            ${isDark ? 'bg-slate-800/95 border-slate-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-slate-200' : 'bg-white/95 border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-800'}
        `}>
            <div>
                <h3 className={`m-0 text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Clusters détectés
                </h3>
                <p className={`m-0 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {clusters.length} groupes thématiques trouvés.
                </p>
            </div>
            
            <div className="overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                {clusters.map((cluster) => (
                    <button 
                        key={cluster.id}
                        onClick={() => {
                            if (onStartClusterReview) {
                                onStartClusterReview(cluster.nodeIds);
                            }
                        }}
                        className={`text-left p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:-translate-y-[2px] hover:shadow-md
                            ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-700' : 'bg-slate-50 hover:bg-white border-slate-200'}
                         border-t-transparent border-r-transparent border-b-transparent`}
                        style={{ borderLeftColor: getClusterColor(cluster.id) }}
                    >
                        <div className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {cluster.mainSubject} ({cluster.nodeIds.length} fiches)
                        </div>
                        {cluster.mainTags.length > 0 && (
                            <div className={`text-xs flex gap-1 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {cluster.mainTags.map(tag => (
                                    <span key={tag} className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200/50'}`}>#{tag}</span>
                                ))}
                            </div>
                        )}
                    </button>
                ))}
                {clusters.length === 0 && (
                    <div className={`p-3 text-sm text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Aucun cluster dense détecté. (Attendez le chargement ou baissez le seuil)
                    </div>
                )}
            </div>
        </div>
    );
};
