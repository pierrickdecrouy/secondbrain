import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { fastLexicalSearch } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';
import { Eye, EyeSlash, X, PencilSimple, Trash, Link, CaretLeft, CaretRight } from '@phosphor-icons/react';

// --- THEME MAP ---
const lightThemeMap: Record<string, { bubble: string, tagBg: string, tagText: string, title: string, examBtn: string, fill: string }> = {
    drug: {
        bubble: 'bg-emerald-50',
        tagBg: 'bg-emerald-100/50',
        tagText: 'text-emerald-700',
        title: 'text-emerald-600',
        examBtn: 'text-emerald-600 hover:bg-emerald-50',
        fill: 'currentColor'
    },
    disease: {
        bubble: 'bg-red-50',
        tagBg: 'bg-red-100/50',
        tagText: 'text-red-700',
        title: 'text-red-600',
        examBtn: 'text-red-600 hover:bg-red-50',
        fill: 'currentColor'
    },
    anatomy: {
        bubble: 'bg-indigo-50',
        tagBg: 'bg-indigo-100/50',
        tagText: 'text-indigo-700',
        title: 'text-indigo-600',
        examBtn: 'text-indigo-600 hover:bg-indigo-50',
        fill: 'currentColor'
    },
    default: {
        bubble: 'bg-orange-50',
        tagBg: 'bg-orange-100/50',
        tagText: 'text-orange-700',
        title: 'text-orange-600',
        examBtn: 'text-orange-600 hover:bg-orange-50',
        fill: 'currentColor'
    }
};

const darkThemeMap: Record<string, { bubble: string, tagBg: string, tagText: string, title: string, examBtn: string, fill: string }> = {
    drug: {
        bubble: 'bg-emerald-900/30',
        tagBg: 'bg-emerald-900/50',
        tagText: 'text-emerald-400',
        title: 'text-emerald-400',
        examBtn: 'text-emerald-400 hover:bg-emerald-900/40',
        fill: 'currentColor'
    },
    disease: {
        bubble: 'bg-red-900/30',
        tagBg: 'bg-red-900/50',
        tagText: 'text-red-400',
        title: 'text-red-400',
        examBtn: 'text-red-400 hover:bg-red-900/40',
        fill: 'currentColor'
    },
    anatomy: {
        bubble: 'bg-indigo-900/30',
        tagBg: 'bg-indigo-900/50',
        tagText: 'text-indigo-400',
        title: 'text-indigo-400',
        examBtn: 'text-indigo-400 hover:bg-indigo-900/40',
        fill: 'currentColor'
    },
    default: {
        bubble: 'bg-orange-900/30',
        tagBg: 'bg-orange-900/50',
        tagText: 'text-orange-400',
        title: 'text-orange-400',
        examBtn: 'text-orange-400 hover:bg-orange-900/40',
        fill: 'currentColor'
    }
};

interface DetailModalProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onLinkClick: (cardId: string) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
    card, allCards, onClose, onLinkClick, onEdit, onDelete, onNext, onPrev,
}) => {
    const [isExamMode, setIsExamMode] = useState(false);
    const [backlinks, setBacklinks] = useState<Card[]>([]);
    const { darkMode, getCategoryIcon, getCategoryColor } = useTheme();

    const themeMap = darkMode ? darkThemeMap : lightThemeMap;
    const theme = themeMap[card.type] || themeMap.default;
    const cardColor = getCategoryColor(card.type);

    // Handle clicking outside to close
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    /* ── backlinks ── */
    useEffect(() => {
        if (!card.title) { setBacklinks([]); return; }
        let alive = true;
        fastLexicalSearch(card.title).then(res => {
            if (!alive) return;
            const ids = new Set(res.map(r => r.id));
            ids.delete(card.id);
            setBacklinks(allCards.filter(c => ids.has(c.id)).sort((a, b) => a.title.localeCompare(b.title)));
        });
        return () => { alive = false; };
    }, [card.title, card.id, allCards]);

    /* ── forward links ── */
    const forwardLinks = useMemo(() => {
        const haystack = ((card.details || '') + ' ' + (card.content || '')).toLowerCase();
        return allCards
            .filter(c => c.id !== card.id && c.title.length >= 3 && haystack.includes(c.title.toLowerCase()))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [card, allCards]);

    /* ── quality ── */
    const quality = useMemo(
        () => calculateQualityScore(card, backlinks.length + forwardLinks.length),
        [card, backlinks.length, forwardLinks.length],
    );

    /* ── keyboard ── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowRight' && onNext) onNext();
            else if (e.key === 'ArrowLeft' && onPrev) onPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onNext, onPrev]);

    const modalRef = useFocusTrap(true);

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity z-[100] flex items-center justify-center p-4 sm:p-6 gap-4 sm:gap-8"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            {/* External Previous Button */}
            <AnimatePresence>
                {onPrev && (
                    <motion.button
                        key="prev"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                        onClick={onPrev}
                        className="hidden sm:flex shrink-0 p-4 md:p-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95"
                        aria-label="Fiche précédente"
                    >
                        <CaretLeft className="w-8 h-8 md:w-10 md:h-10" weight="bold" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal Container */}
            <motion.div
                ref={modalRef}
                key={card.id}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={[
                    'rounded-[32px] shadow-2xl w-full max-w-4xl min-h-[600px] max-h-[90vh] flex flex-col overflow-hidden relative z-50 transform transition-all border',
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                ].join(' ')}
            >
                {/* Category Color Bubble (Top Right) */}
                <div 
                    className="absolute -top-32 -right-32 w-80 h-80 rounded-full z-0 pointer-events-none transition-colors duration-500"
                    style={{ backgroundColor: cardColor, opacity: darkMode ? 0.15 : 0.1 }}
                ></div>

                <div className="relative z-10 flex flex-col flex-1 min-h-0 h-full w-full">

                    {/* Header Actions & Tags */}
                    <div  className="flex flex-wrap gap-4 items-start justify-between shrink-0 pt-10 px-12 pb-4">
                        <div className="flex items-center gap-3">
                            {/* Category Tag */}
                            <span className={`inline-flex items-center gap-2.5 ${theme.tagText} ${theme.tagBg} px-4 py-2 rounded-xl text-sm font-semibold tracking-wide`}>
                                <DynamicIcon name={getCategoryIcon(card.type)} size={18} color="currentColor" weight="bold" />
                                {card.type}
                            </span>

                            {/* Status indicator */}
                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: quality.color }}></span>
                                {quality.label} ({quality.score}%)
                            </span>
                        </div>

                        {/* Header Actions */}
                        <div className={`${['flex items-center gap-1.5 rounded-xl border shadow-sm ml-auto', darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200/80'].join(' ')} detailmodal-style-2`} >
                            {onEdit && (
                                <button onClick={onEdit} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} aria-label="Éditer" title="Éditer">
                                    <PencilSimple size={18} weight="bold" />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={onDelete} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40 text-slate-400 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-400'}`} aria-label="Supprimer" title="Supprimer">
                                    <Trash size={18} weight="bold" />
                                </button>
                            )}

                            <div className={`w-[1px] h-6 mx-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                            <button
                                onClick={() => setIsExamMode(v => !v)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg transition-colors uppercase tracking-widest ${theme.examBtn} ${isExamMode ? (darkMode ? 'bg-slate-700/50' : 'bg-slate-100') : ''}`}
                            >
                                {isExamMode ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                                Examen
                            </button>

                            <div className={`w-[1px] h-6 mx-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} aria-label="Fermer">
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                    </div>

                    <div  className="shrink-0 mt-2 px-12 pb-6">
                        <h2 className={`text-3xl md:text-4xl font-bold leading-tight mb-2 ${theme.title}`}>
                            {card.title}
                        </h2>
                        {card.subtitle && (
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                {card.subtitle}
                            </p>
                        )}
                    </div>

                    <div  className={`px-12 overflow-y-auto flex-1 min-h-0 ${isExamMode ? 'exam-mode' : ''}`}>
                        <div className={`prose prose-slate prose-lg max-w-none leading-relaxed font-normal ${darkMode ? 'text-slate-300 prose-invert' : 'text-slate-600'}`}>
                            {card.imageUrl && (
                                <div className="mb-6 not-prose">
                                    <img src={card.imageUrl} alt={card.title} className="w-full rounded-2xl shadow-sm object-cover" />
                                </div>
                            )}

                            {card.content && card.content.trim() !== card.details?.trim() && (
                                <MarkdownRenderer
                                    className="max-w-none"
                                    content={card.content}
                                    onInternalLinkClick={target => {
                                        const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                        if (found) onLinkClick(found.id);
                                    }}
                                />
                            )}

                            {card.details && (
                                <div className={card.content && card.content.trim() !== card.details?.trim() ? 'mt-6' : ''}>
                                    {card.content && card.content.trim() !== card.details?.trim() && (
                                        <p className="not-prose uppercase text-xs tracking-[0.08em] font-semibold mb-3 text-slate-400">
                                            Détails
                                        </p>
                                    )}
                                    <MarkdownRenderer
                                        className="max-w-none"
                                        content={card.details}
                                        onInternalLinkClick={target => {
                                            const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                            if (found) onLinkClick(found.id);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    {(forwardLinks.length > 0 || backlinks.length > 0 || (card.tags && card.tags.length > 0)) && (
                        <div  className={`px-12 py-8 shrink-0 border-t flex flex-col gap-8 relative z-20 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                            {/* Outgoing Links */}
                            {forwardLinks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Link size={16} weight="bold" />
                                        Liens sortants ({forwardLinks.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {forwardLinks.map(link => (
                                            <button key={link.id} onClick={() => onLinkClick(link.id)} className={`inline-flex items-center px-7 py-3.5 rounded-[14px] border text-base font-semibold transition-all ${darkMode ? 'border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700' : 'border-slate-200/80 text-slate-700 bg-white hover:border-slate-300'}`}>
                                                {link.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Backlinks */}
                            {backlinks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <Link size={16} weight="bold" />
                                        Mentionné dans ({backlinks.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {backlinks.map(link => (
                                            <button key={link.id} onClick={() => onLinkClick(link.id)} className={`inline-flex items-center px-7 py-3.5 rounded-[14px] border text-base font-semibold transition-all ${darkMode ? 'border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700' : 'border-slate-200/80 text-slate-700 bg-white hover:border-slate-300'}`}>
                                                {link.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {card.tags && card.tags.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {card.tags.map(tag => (
                                        <span key={tag} className={`inline-flex items-center px-6 py-3 rounded-[14px] text-sm font-bold uppercase tracking-wide transition-colors ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100/70 text-slate-500 hover:bg-slate-200'}`}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* External Next Button (Desktop) */}
            <AnimatePresence>
                {onNext && (
                    <motion.button
                        key="next"
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        onClick={onNext}
                        className="hidden sm:flex shrink-0 p-4 md:p-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95"
                        aria-label="Fiche suivante"
                    >
                        <CaretRight className="w-8 h-8 md:w-10 md:h-10" weight="bold" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Navigation Fallback */}
            {(onPrev || onNext) && (
                <div className="fixed bottom-6 left-0 right-0 z-50 flex sm:hidden justify-center gap-4 px-4 pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md rounded-xl p-1 pointer-events-auto shadow-xl">
                        <button disabled={!onPrev} onClick={onPrev} className={`p-3 rounded-lg text-white transition-colors ${onPrev ? 'hover:bg-white/20' : 'opacity-30 cursor-not-allowed'}`} aria-label="Fiche précédente">
                            <CaretLeft className="w-5 h-5" weight="bold" />
                        </button>
                        <div className="w-px h-6 bg-white/20"></div>
                        <button disabled={!onNext} onClick={onNext} className={`p-3 rounded-lg text-white transition-colors ${onNext ? 'hover:bg-white/20' : 'opacity-30 cursor-not-allowed'}`} aria-label="Fiche suivante">
                            <CaretRight className="w-5 h-5" weight="bold" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
