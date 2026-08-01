import React, { useMemo, useState, useEffect } from 'react';
import { X, PushPin, PushPinSlash, CaretLeft, CaretRight, Link, CornersOut, Eye, EyeSlash } from '@phosphor-icons/react';
import type { Card } from '../types';
import { Badge } from './Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { fastLexicalSearch } from '../searchIndex';
import { calculateQualityScore } from '../algorithms/qualityScoring';
import { useTheme } from '../context/ThemeContext';
import { getTypeColor } from '../theme';

function hexToRgba(hex: string, alpha: number): string {
    if (!hex) return 'rgba(0,0,0,0.1)';
    if (hex.startsWith('hsl')) return hex.replace(')', `, ${alpha})`).replace('hsl(', 'hsla(');
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return 'rgba(0,0,0,0.1)';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface CardSidePanelProps {
    card: Card;
    allCards: Card[];
    onClose: () => void;
    onPinToggle: () => void;
    pinned: boolean;
    onLinkClick: (cardId: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    onExpand?: () => void;
}

export const CardSidePanel: React.FC<CardSidePanelProps> = ({
    card,
    allCards,
    onClose,
    onPinToggle,
    pinned,
    onLinkClick,
    onPrev,
    onNext,
    onExpand,
}) => {
    const [isExamMode, setIsExamMode] = useState(false);
    const [backlinks, setBacklinks] = useState<Card[]>([]);

    const { getCategoryColor, darkMode } = useTheme();
    const categoryColor = getCategoryColor ? getCategoryColor(card.type) : getTypeColor(card.type);
    const bubbleOpacity = darkMode ? 0.15 : 0.08;

    useEffect(() => {
        if (!card.title) { setBacklinks([]); return; }
        let isActive = true;
        fastLexicalSearch(card.title).then(results => {
            if (!isActive) return;
            const uniqueIds = new Set(results.map(r => r.id));
            uniqueIds.delete(card.id);
            const matchingCards = allCards
                .filter(c => uniqueIds.has(c.id))
                .sort((a, b) => a.title.localeCompare(b.title))
                .slice(0, 12);
            setBacklinks(matchingCards);
        });
        return () => { isActive = false; };
    }, [card.title, card.id, allCards]);

    const forwardLinks = useMemo(() => {
        const searchText = ((card.details || '') + ' ' + (card.content || '')).toLowerCase();
        return allCards.filter(c => {
            if (c.id === card.id) return false;
            if (c.title.length < 3) return false;
            return searchText.includes(c.title.toLowerCase());
        }).sort((a, b) => a.title.localeCompare(b.title));
    }, [card, allCards]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            else if (e.key === 'ArrowRight' && onNext) onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onPrev, onNext]);

    const quality = calculateQualityScore(card, card.manualConnections?.length || backlinks.length + forwardLinks.length);
    const hasFooter = forwardLinks.length > 0 || backlinks.length > 0 || (card.tags && card.tags.length > 0);

    const dividerStyle = {
        width: '1px',
        height: '16px',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        flexShrink: 0,
    };

    const pillStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: darkMode ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(226,232,240,0.8)',
        borderRadius: '16px',
        padding: '6px 8px',
        flexShrink: 0,
    };

    const iconBtnBase = `p-3 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`;

    return (
        <aside
            className="card-side-panel flex flex-col h-full relative overflow-hidden transition-colors shadow-[-10px_0_30px_rgba(0,0,0,0.03)]"
            style={{
  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
  borderLeft: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'
}}
        >
            {/* Decorative bubble */}
            <div
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none transition-colors duration-500"
                style={{ backgroundColor: hexToRgba(categoryColor, bubbleOpacity) }}
            />

            <div className="relative z-10 flex flex-col flex-1 min-h-0">

                {/* ── Header ── */}
                <div className="px-10 pt-10 pb-0 flex items-center justify-between shrink-0">
                    {/* Left: Badge + Quality */}
                    <div className="flex items-center gap-4">
                        <Badge type={card.type} />
                        <div
                            className="flex items-center gap-2 text-sm font-medium cursor-help"
                            style={{ color: quality.color }}
                            title={`Score de qualité : ${quality.score}/100`}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: quality.color }} />
                            {quality.label}
                        </div>
                    </div>

                    {/* Right: Actions pill */}
                    <div style={pillStyle}>
                        {/* Prev / Next */}
                        {onPrev && (
                            <button className={iconBtnBase} onClick={onPrev} title="Précédent (←)">
                                <CaretLeft size={20} weight="light" />
                            </button>
                        )}
                        {onNext && (
                            <button className={iconBtnBase} onClick={onNext} title="Suivant (→)">
                                <CaretRight size={20} weight="light" />
                            </button>
                        )}

                        {(onPrev || onNext) && <div style={dividerStyle} className="mx-2" />}

                        {/* Expand */}
                        {onExpand && (
                            <button className={iconBtnBase} onClick={onExpand} title="Plein écran">
                                <CornersOut size={20} weight="light" />
                            </button>
                        )}

                        {/* Exam mode */}
                        <button
                            className={`p-3 rounded-xl transition-colors ${
                                isExamMode
                                    ? darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                    : darkMode ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            onClick={() => setIsExamMode(!isExamMode)}
                            title={isExamMode ? 'Désactiver le mode examen' : 'Activer le mode examen'}
                        >
                            {isExamMode ? <Eye size={20} weight="light" /> : <EyeSlash size={20} weight="light" />}
                        </button>

                        <div style={dividerStyle} className="mx-2" />

                        {/* Pin */}
                        <button
                            className={`p-3 rounded-xl transition-colors ${
                                pinned
                                    ? darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
                                    : darkMode ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                            onClick={onPinToggle}
                            title={pinned ? 'Dépingler' : 'Épingler'}
                        >
                            {pinned ? <PushPinSlash size={20} weight="fill" /> : <PushPin size={20} weight="light" />}
                        </button>

                        {/* Close */}
                        <button className={iconBtnBase} onClick={onClose} aria-label="Fermer" title="Fermer">
                            <X size={20} weight="light" />
                        </button>
                    </div>
                </div>

                {/* ── Title ── */}
                <div className="px-10 pt-8 pb-6 shrink-0">
                    {card.subtitle && (
                        <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {card.subtitle}
                        </p>
                    )}
                    <h2
                        className="text-3xl sm:text-[32px] font-bold leading-tight"
                        style={{ color: categoryColor }}
                    >
                        {card.title}
                    </h2>
                </div>

                {/* ── Scrollable content ── */}
                <div className={`px-10 pb-12 overflow-y-auto custom-scrollbar flex-1 min-h-0 ${isExamMode ? 'exam-mode' : ''}`}>

                    {/* Image */}
                    {card.imageUrl && (
                        <div className="mb-6">
                            <img src={card.imageUrl} alt={card.title} className="w-full rounded-2xl shadow-sm" />
                        </div>
                    )}

                    {/* Summary */}
                    {card.content && card.content.trim() !== card.details?.trim() && (
                        <MarkdownRenderer
                            className={`prose-lg font-normal leading-relaxed ${darkMode ? 'prose-invert text-slate-300' : 'prose-slate text-slate-600'}`}
                            content={card.content}
                            onInternalLinkClick={target => {
                                const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                if (found) onLinkClick(found.id);
                            }}
                        />
                    )}

                    {/* Details */}
                    {card.details && (
                        <div className={card.content && card.content.trim() !== card.details?.trim() ? 'mt-6' : ''}>
                            {card.content && card.content.trim() !== card.details?.trim() && (
                                <h4 className={`uppercase text-sm mb-3 tracking-[0.06em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Détails
                                </h4>
                            )}
                            <MarkdownRenderer
                                className={`prose-lg font-normal leading-relaxed ${darkMode ? 'prose-invert text-slate-300' : 'prose-slate text-slate-600'}`}
                                content={card.details}
                                onInternalLinkClick={target => {
                                    const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                                    if (found) onLinkClick(found.id);
                                }}
                            />
                        </div>
                    )}

                    {/* ── Footer: Links + Tags ── */}
                    {hasFooter && (
                        <div className={`mt-12 pt-6 flex flex-col gap-6 ${darkMode ? 'border-t border-slate-800' : 'border-t border-slate-100'}`}>

                            {/* Forward links */}
                            {forwardLinks.length > 0 && (
                                <div>
                                    <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <Link size={16} />
                                        Liens sortants ({forwardLinks.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {forwardLinks.map(link => (
                                            <button
                                                key={link.id}
                                                className={`inline-flex items-center px-6 py-3 rounded-[14px] text-sm font-medium transition-all ${
                                                    darkMode
                                                        ? 'border border-slate-700/50 text-slate-300 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600'
                                                        : 'border border-slate-200/50 text-slate-600 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                                                }`}
                                                onClick={() => onLinkClick(link.id)}
                                            >
                                                {link.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Backlinks */}
                            {backlinks.length > 0 && (
                                <div>
                                    <h3 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <Link size={16} />
                                        Mentionné dans ({backlinks.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {backlinks.map(link => (
                                            <button
                                                key={link.id}
                                                className={`inline-flex items-center px-6 py-3 rounded-[14px] text-sm font-medium transition-all ${
                                                    darkMode
                                                        ? 'border border-slate-700/50 text-slate-300 bg-slate-800/40 hover:bg-slate-700/60 hover:border-slate-600'
                                                        : 'border border-slate-200/50 text-slate-600 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                                                }`}
                                                onClick={() => onLinkClick(link.id)}
                                            >
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
                                        <span
                                            key={tag}
                                            className={`inline-flex items-center px-5 py-2.5 rounded-[12px] text-sm font-medium cursor-pointer transition-colors ${
                                                darkMode
                                                    ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
                                                    : 'bg-slate-100/60 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
