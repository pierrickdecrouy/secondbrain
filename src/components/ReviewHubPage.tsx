import React from 'react';
import { Brain, Graph, Lightning, CheckCircle, LockKey } from '@phosphor-icons/react';

interface ReviewHubPageProps {
    onSelectFSRS: () => void;
    onSelectCluster: () => void;
    onSelectIntensive: () => void;
    totalDue: number;
    hasEnoughCardsForCluster: boolean;
}

export const ReviewHubPage: React.FC<ReviewHubPageProps> = ({
    onSelectFSRS,
    onSelectCluster,
    onSelectIntensive,
    totalDue,
    hasEnoughCardsForCluster
}) => {
    return (
        <div className="relative flex-1 overflow-y-auto bg-[var(--color-bg)] w-full h-full p-6 md:p-8 animate-in fade-in duration-300">

            <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-8 pb-20 pt-8">
                <header className="flex flex-col gap-5">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">
                            Espace de Révision
                        </h1>
                        <p className="mt-2 text-base text-[var(--color-text-muted)] max-w-2xl">
                            Optimisez votre apprentissage grâce à la répétition espacée, ou ciblez des sujets précis avec des modes spécialisés.
                        </p>
                    </div>

                    <div>
                        {totalDue > 0 ? (
                            <div className="inline-flex items-center gap-3 rounded-full border-2 text-[var(--color-drug)] text-[15px] font-bold transition-transform hover:scale-[1.02] cursor-default" style={{ padding: '10px 24px', borderColor: 'rgba(5, 150, 105, 0.2)', backgroundColor: 'rgba(5, 150, 105, 0.05)' }}>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-drug)] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-drug)]"></span>
                                </span>
                                {totalDue} carte{totalDue > 1 ? 's' : ''} à réviser
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-3 rounded-full border text-[var(--color-text)] text-[15px] font-semibold transition-transform hover:scale-[1.02] cursor-default" style={{ padding: '10px 24px', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <CheckCircle size={20} weight="fill" style={{ color: 'var(--color-success)' }} />
                                Aucune révision due
                            </div>
                        )}
                    </div>
                </header>

                <div className="relative z-10 card-grid mt-4">
                    
                    {/* Primary Mode: FSRS */}
                    <div
                        className="card-item"
                        role="button"
                        tabIndex={totalDue > 0 ? 0 : -1}
                        onClick={totalDue > 0 ? onSelectFSRS : undefined}
                        style={{ display: 'flex', flexDirection: 'column', opacity: totalDue > 0 ? 1 : 0.6, cursor: totalDue > 0 ? 'pointer' : 'not-allowed' }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="card-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Brain size={12} weight="bold" /> FSRS
                            </span>
                            {totalDue === 0 && <LockKey size={16} className="text-[var(--color-text-muted)]" />}
                        </div>
                        
                        <h3 className="card-title">Révisions Planifiées</h3>
                        <p className="card-subtitle">Quotidien</p>
                        
                        <p className="card-content" style={{ WebkitLineClamp: 'unset', flex: 1 }}>
                            Le mode de révision optimal pour la mémoire à long terme. L'algorithme d'IA analyse votre courbe de l'oubli et sélectionne précisément les cartes que vous devez revoir aujourd'hui.
                        </p>
                        
                        <div className="mt-5">
                            {totalDue > 0 ? (
                                <button className="btn-primary w-full justify-center flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    Démarrer ({totalDue})
                                </button>
                            ) : (
                                <button className="btn-secondary w-full justify-center flex items-center gap-2" disabled>
                                    <LockKey size={14} /> Aucune carte
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cluster Mode Card */}
                    <div
                        className="card-item"
                        role="button"
                        tabIndex={hasEnoughCardsForCluster ? 0 : -1}
                        onClick={hasEnoughCardsForCluster ? onSelectCluster : undefined}
                        style={{ display: 'flex', flexDirection: 'column', opacity: hasEnoughCardsForCluster ? 1 : 0.6, cursor: hasEnoughCardsForCluster ? 'pointer' : 'not-allowed' }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="card-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-indigo-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Graph size={12} weight="bold" /> CLUSTER
                            </span>
                            {!hasEnoughCardsForCluster && <LockKey size={16} className="text-[var(--color-text-muted)]" />}
                        </div>
                        
                        <h3 className="card-title">Révision par Cluster</h3>
                        <p className="card-subtitle">Thématique</p>
                        
                        <p className="card-content" style={{ WebkitLineClamp: 'unset', flex: 1 }}>
                            Sélectionnez un nœud central pour réviser tous les concepts qui y sont liés directement. Parfait pour renforcer les connexions.
                        </p>
                        
                        <div className="mt-5">
                            {hasEnoughCardsForCluster ? (
                                <button className="btn-primary w-full justify-center flex items-center gap-2" style={{ backgroundColor: 'var(--color-indigo-600)' }}>
                                    <Graph size={14} /> Explorer
                                </button>
                            ) : (
                                <button className="btn-secondary w-full justify-center flex items-center gap-2" disabled>
                                    <LockKey size={14} /> Liens insuffisants
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Intensive Mode Card */}
                    <div
                        className="card-item"
                        role="button"
                        tabIndex={0}
                        onClick={onSelectIntensive}
                        style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="card-badge" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--color-orange-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Lightning size={12} weight="bold" /> INTENSIF
                            </span>
                        </div>
                        
                        <h3 className="card-title">Bachotage Intensif</h3>
                        <p className="card-subtitle">Urgence</p>
                        
                        <p className="card-content" style={{ WebkitLineClamp: 'unset', flex: 1 }}>
                            Besoin de réviser en urgence ? Sélectionnez un ensemble de cartes au hasard. Les résultats n'affecteront pas votre calendrier FSRS.
                        </p>
                        
                        <div className="mt-5">
                            <button className="btn-primary w-full justify-center flex items-center gap-2" style={{ backgroundColor: 'var(--color-orange-600)' }}>
                                <Lightning size={14} /> Session aléatoire
                            </button>
                        </div>
                    </div>
                </div>   
            </div>
        </div>
    );
};
