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
    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, action?: () => void) => {
        if (!action) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    return (
        <div className="relative flex-1 overflow-y-auto bg-[var(--color-bg)] w-full h-full p-6 md:p-8 animate-in fade-in duration-300">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--color-drug)]/10 blur-3xl" />
                <div className="absolute top-28 left-12 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute bottom-10 right-12 h-52 w-52 rounded-full bg-orange-400/10 blur-3xl" />
            </div>

            <div className="relative max-w-6xl mx-auto flex flex-col gap-8 pb-20 pt-2">
                <header className="text-center">
                    <div className="mx-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-drug)]/20 to-emerald-500/20 p-4 text-[var(--color-drug)] shadow-lg shadow-[var(--color-drug)]/10">
                        <ClockCounterClockwise size={34} weight="bold" />
                    </div>

                    <div className="mt-5 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] backdrop-blur">
                        Focus quotidien
                    </div>

                    <h1 className="mt-4 text-4xl md:text-5xl font-black text-[var(--color-text)] tracking-tight">
                        Espace de Révision
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
                        Optimisez votre apprentissage grâce à des algorithmes intelligents de répétition espacée, ou ciblez des sujets précis avec des modes spécialisés.
                    </p>

                    <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                        {totalDue > 0 ? `${totalDue} carte${totalDue > 1 ? 's' : ''} à réviser aujourd'hui` : 'Aucune révision due aujourd’hui'}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                    <div
                        role="button"
                        tabIndex={totalDue > 0 ? 0 : -1}
                        onClick={totalDue > 0 ? onSelectFSRS : undefined}
                        onKeyDown={(event) => handleCardKeyDown(event, totalDue > 0 ? onSelectFSRS : undefined)}
                        className={`group relative overflow-hidden text-left w-full rounded-3xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col h-full gap-0 ${totalDue > 0
                            ? 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer dark:hover:border-emerald-700'
                            : 'border-[var(--color-border)] opacity-70 cursor-not-allowed'
                            }`}
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
                        <div className="flex items-start justify-between mb-5 mt-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                <Brain weight="bold" size={14} />
                                FSRS
                            </div>

                            {totalDue === 0 && (
                                <div className="text-[var(--color-text-muted)]">
                                    <LockKey size={16} />
                                </div>
                            )}
                        </div>
                        
                        <div className="mb-2">
                            <h3 className="font-bold text-xl mb-1 text-[var(--color-text)]">
                                Révisions Planifiées
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Algorithme de mémoire FSRS
                            </p>
                        </div>
                        
                        <p className="text-[0.95rem] text-[var(--color-text-muted)] leading-[1.6] flex-1">
                            Le mode de révision optimal pour la mémoire à long terme. L'algorithme d'IA analyse votre courbe de l'oubli et sélectionne précisément les cartes que vous devez revoir aujourd'hui.
                        </p>

                        <div className="mt-5 flex items-center">
                            {totalDue > 0 ? (
                                <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl font-semibold text-sm dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors w-full justify-center">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Démarrer ({totalDue})
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium text-sm dark:bg-slate-800/50 dark:border-slate-700 w-full justify-center">
                                    <LockKey size={14} />
                                    Aucune carte
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={hasEnoughCardsForCluster ? 0 : -1}
                        onClick={hasEnoughCardsForCluster ? onSelectCluster : undefined}
                        onKeyDown={(event) => handleCardKeyDown(event, hasEnoughCardsForCluster ? onSelectCluster : undefined)}
                        className={`group relative overflow-hidden text-left w-full rounded-3xl border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col h-full gap-0 ${hasEnoughCardsForCluster
                            ? 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer dark:hover:border-indigo-700'
                            : 'border-[var(--color-border)] opacity-70 cursor-not-allowed'
                            }`}
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                        <div className="flex items-start justify-between mb-5 mt-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                                <Graph weight="bold" size={14} />
                                CLUSTER
                            </div>

                            {!hasEnoughCardsForCluster && (
                                <div className="text-[var(--color-text-muted)]">
                                    <LockKey size={16} />
                                </div>
                            )}
                        </div>
                        
                        <div className="mb-2">
                            <h3 className="font-bold text-xl mb-1 text-[var(--color-text)]">
                                Révision par Cluster
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Apprentissage thématique
                            </p>
                        </div>
                        
                        <p className="text-[0.95rem] text-[var(--color-text-muted)] leading-[1.6] flex-1">
                            Sélectionnez un sujet central pour réviser tous les concepts qui y sont liés directement. Parfait pour renforcer les connexions.
                        </p>

                        <div className="mt-5">
                            {hasEnoughCardsForCluster ? (
                                <div className="inline-flex items-center justify-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl font-semibold text-sm dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors w-full">
                                    Accéder au graphe
                                </div>
                            ) : (
                                <div className="inline-flex items-center justify-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium text-sm dark:bg-slate-800/50 dark:border-slate-700 w-full">
                                    <LockKey size={14} />
                                    Pas assez de liens
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={onSelectIntensive}
                        onKeyDown={(event) => handleCardKeyDown(event, onSelectIntensive)}
                        className="group relative overflow-hidden text-left w-full rounded-3xl border border-[var(--color-border)] transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col h-full gap-0 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer dark:hover:border-orange-700"
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />
                        <div className="flex items-start justify-between mb-5 mt-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">
                                <Lightning weight="bold" size={14} />
                                INTENSIF
                            </div>
                        </div>

                        <div className="mb-2">
                            <h3 className="font-bold text-xl mb-1 text-[var(--color-text)]">
                                Bachotage Intensif
                            </h3>
                            <p className="font-mono text-[0.8rem] text-[var(--color-text-muted)] mb-3">
                                Session hors-calendrier
                            </p>
                        </div>
                        
                        <p className="text-[0.95rem] text-[var(--color-text-muted)] leading-[1.6] flex-1">
                            Besoin de réviser en urgence ? Sélectionnez un ensemble de cartes au hasard. Les résultats n'affecteront pas votre calendrier FSRS.
                        </p>

                        <div className="mt-5">
                            <div className="inline-flex items-center justify-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-xl font-semibold text-sm dark:bg-orange-500/10 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors w-full">
                                Session aléatoire
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
