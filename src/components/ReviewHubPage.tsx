import React from 'react';
import { Brain, Graph, Lightning, ClockCounterClockwise, LockKey } from '@phosphor-icons/react';

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
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg)] w-full h-full p-8 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-20 pt-4">
                
                {/* Page Header */}
                <header className="flex flex-col gap-4 text-center items-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-[var(--color-drug)]/10 text-[var(--color-drug)]">
                        <ClockCounterClockwise size={32} weight="bold" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                        Espace de Révision
                    </h1>
                    <p className="text-base text-[var(--color-text-muted)] max-w-xl">
                        Optimisez votre apprentissage grâce à des algorithmes intelligents de répétition espacée, ou ciblez des sujets précis avec des modes spécialisés.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Primary Mode: FSRS */}
                    <div
                        role="button"
                        tabIndex={totalDue > 0 ? 0 : -1}
                        onClick={totalDue > 0 ? onSelectFSRS : undefined}
                        className={`group relative text-left w-full rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col h-full gap-0 ${totalDue > 0
                            ? 'border-[var(--color-border)] hover:border-emerald-300 hover:shadow-md cursor-pointer dark:hover:border-emerald-700'
                            : 'border-[var(--color-border)] opacity-70 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                <Brain weight="bold" size={14} />
                                FSRS
                            </div>
                            
                            {totalDue === 0 && (
                                <div className="text-[var(--color-text-muted)]">
                                    <LockKey size={16} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-[var(--color-text)]">
                                Révisions Planifiées
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Algorithme de mémoire FSRS
                            </p>
                        </div>
                        
                        <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-[1.5] flex-1">
                            Le mode de révision optimal pour la mémoire à long terme. L'algorithme d'IA analyse votre courbe de l'oubli et sélectionne précisément les cartes que vous devez revoir aujourd'hui.
                        </p>
                        
                        <div className="mt-4 flex items-center">
                            {totalDue > 0 ? (
                                <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold text-sm dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors w-full justify-center">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Démarrer ({totalDue})
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-sm dark:bg-slate-800/50 dark:border-slate-700 w-full justify-center">
                                    <LockKey size={14} />
                                    Aucune carte
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cluster Mode Card */}
                    <div
                        role="button"
                        tabIndex={hasEnoughCardsForCluster ? 0 : -1}
                        onClick={hasEnoughCardsForCluster ? onSelectCluster : undefined}
                        className={`group relative text-left w-full rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col h-full gap-0 ${hasEnoughCardsForCluster
                            ? 'border-[var(--color-border)] hover:border-indigo-300 hover:shadow-md cursor-pointer dark:hover:border-indigo-700'
                            : 'border-[var(--color-border)] opacity-70 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                                <Graph weight="bold" size={14} />
                                CLUSTER
                            </div>
                            
                            {!hasEnoughCardsForCluster && (
                                <div className="text-[var(--color-text-muted)]">
                                    <LockKey size={16} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-[var(--color-text)]">
                                Révision par Cluster
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Apprentissage thématique
                            </p>
                        </div>
                        
                        <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-[1.5] flex-1">
                            Sélectionnez un sujet central pour réviser tous les concepts qui y sont liés directement. Parfait pour renforcer les connexions.
                        </p>
                        
                        <div className="mt-4">
                            {hasEnoughCardsForCluster ? (
                                <div className="inline-flex items-center justify-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg font-semibold text-sm dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors w-full">
                                    Accéder au graphe
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-slate-500 font-medium text-sm w-full py-1.5">
                                    <LockKey size={14} />
                                    Pas assez de liens
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Intensive Mode Card */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={onSelectIntensive}
                        className="group relative text-left w-full rounded-2xl border border-[var(--color-border)] transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col h-full gap-0 hover:border-orange-300 hover:shadow-md cursor-pointer dark:hover:border-orange-700"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">
                                <Lightning weight="bold" size={14} />
                                INTENSIF
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-[var(--color-text)]">
                                Bachotage Intensif
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Session hors-calendrier
                            </p>
                        </div>
                        
                        <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-[1.5] flex-1">
                            Besoin de réviser en urgence ? Sélectionnez un ensemble de cartes au hasard. Les résultats n'affecteront pas votre calendrier FSRS.
                        </p>
                        
                        <div className="mt-4">
                            <div className="inline-flex items-center justify-center gap-2 text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg font-semibold text-sm dark:bg-orange-500/10 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors w-full">
                                Session aléatoire
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
