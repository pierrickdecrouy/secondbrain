import { useState, useEffect } from 'react';
import { useCardStore as useCards } from '../store/useCardStore';
import { useUIStore as useUI } from '../store/useUIStore';
import { useDueCards } from '../hooks/useDueCards';
import type { AppSection } from '../App';
import { useTheme } from '../context/ThemeContext';
import { Plus, Command, MagnifyingGlass, Brain, ShareNetwork, BookOpen, ArrowRight, Sparkle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from './EmptyState';

interface HomePageProps {
    onNavigate: (section: AppSection) => void;
    onAddCard: () => void;
}

const SEARCH_PLACEHOLDERS = [
    "Que souhaitez-vous explorer aujourd'hui ?",
    "Rechercher une notion, un concept clé...",
    "Tapez un mot-clé (ex: Diabète, Metformine...)",
    "La réponse est probablement ici...",
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAddCard }) => {
    const { cards, isLoading } = useCards();
    const { userName, setOmniboxOpen } = useUI();
    const { totalToReview } = useDueCards(cards);
    const { getCategoryColor } = useTheme();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const now = new Date();

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const hour = now.getHours();
        if (hour >= 22 || hour < 5) return 'Bonne nuit';
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    const recentCards = [...cards]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 3);

    const actionCards = [
        {
            id: 'review',
            icon: <Brain size={24} weight="duotone" />,
            iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            title: 'Sessions',
            subtitle: totalToReview > 0 ? `${totalToReview} cartes en attente` : 'À jour ✓',
            subtitleColor: totalToReview > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400',
            description: "L'algorithme FSRS a sélectionné les cartes optimales pour aujourd'hui.",
            cta: totalToReview > 0 ? 'Commencer' : 'Explorer',
            ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20',
        },
        {
            id: 'courses',
            icon: <BookOpen size={24} weight="duotone" />,
            iconBg: 'bg-amber-50 dark:bg-amber-500/10',
            iconColor: 'text-amber-600 dark:text-amber-400',
            title: 'Cours',
            subtitle: 'Fiches structurées',
            subtitleColor: 'text-amber-600 dark:text-amber-400',
            description: 'Naviguez dans vos fiches de cours et supports documentaires structurés.',
            cta: 'Lire',
            ctaStyle: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm',
        },
        {
            id: 'network',
            icon: <ShareNetwork size={24} weight="duotone" />,
            iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            title: 'Graphe',
            subtitle: `${cards.length} concept${cards.length > 1 ? 's' : ''}`,
            subtitleColor: 'text-emerald-600 dark:text-emerald-400',
            description: 'Explorez visuellement les liens sémantiques entre vos différentes fiches.',
            cta: 'Explorer',
            ctaStyle: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm',
        },
    ];

    return (
        <div className="w-full h-full overflow-y-auto flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Subtle dot grid background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            />

            <main className="relative flex-1 flex flex-col max-w-4xl mx-auto w-full px-8 py-16 justify-center gap-10">

                {/* ── Welcome ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-2"
                >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-1">
                        <Sparkle size={16} weight="fill" />
                        <span>Tableau de bord</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                        {getGreeting()},{' '}
                        <span className="text-indigo-600 dark:text-indigo-400">{userName || 'Bienvenue'}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-normal">
                        Que souhaitez-vous explorer ou réviser aujourd'hui ?
                    </p>
                </motion.div>

                {/* ── Search Omnibox ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative cursor-text group"
                    onClick={() => setOmniboxOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOmniboxOpen(true); }}
                    aria-label="Ouvrir la recherche"
                >
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                        <MagnifyingGlass size={20} className="text-emerald-500/70 group-hover:text-emerald-500 transition-colors" weight="bold" />
                    </div>

                    <div className="absolute inset-y-0 left-14 right-20 flex items-center pointer-events-none overflow-hidden z-10">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={placeholderIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="text-slate-400 dark:text-slate-500 text-base whitespace-nowrap select-none"
                            >
                                {SEARCH_PLACEHOLDERS[placeholderIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    <div className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:shadow-md transition-all duration-200" />

                    <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Command size={13} weight="bold" /> K
                        </span>
                    </div>
                </motion.div>

                {/* ── Action Cards ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {actionCards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => onNavigate(card.id as AppSection)}
                            className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 flex flex-col gap-4 cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}>
                                    {card.icon}
                                </div>
                                <ArrowRight
                                    size={18}
                                    className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200 mt-1"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{card.title}</h2>
                                    <span className={`text-xs font-semibold ${card.subtitleColor}`}>{card.subtitle}</span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{card.description}</p>
                            </div>

                            <div className="mt-auto">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${card.ctaStyle}`}>
                                    {card.cta}
                                </span>
                            </div>
                        </button>
                    ))}
                </motion.div>

                {/* ── Recent Cards ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Ajouts récents
                        </h3>
                        <button
                            onClick={() => onNavigate('cards')}
                            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer flex items-center gap-1 transition-colors"
                        >
                            Tout parcourir <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {isLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-slate-200 dark:bg-slate-800 animate-pulse h-28 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm" />
                                ))}
                            </>
                        ) : recentCards.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState onAction={onAddCard} />
                            </div>
                        ) : (
                            recentCards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => onNavigate('cards')}
                                    className="group text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: getCategoryColor(card.type) }}
                                        />
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-widest truncate"
                                            style={{ color: getCategoryColor(card.type) }}
                                        >
                                            {card.type}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {card.title}
                                    </h4>
                                    {card.subtitle && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{card.subtitle}</p>
                                    )}
                                </button>
                            ))
                        )}

                        {/* Add new card slot */}
                        {!isLoading && recentCards.length > 0 && (
                            <button
                                onClick={onAddCard}
                                className="group bg-transparent p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer flex flex-col items-center justify-center gap-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 min-h-[100px]"
                            >
                                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors">
                                    <Plus size={18} weight="bold" />
                                </div>
                                <span className="text-xs font-semibold">Nouvelle fiche</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
