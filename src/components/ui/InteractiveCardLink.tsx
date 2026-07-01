import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCardStore } from '../../store/useCardStore';
import { Brain, Cards, Warning, TextAa } from '@phosphor-icons/react';

interface InteractiveCardLinkProps {
    target: string;
    children: React.ReactNode;
    onClick?: (target: string) => void;
}

export const InteractiveCardLink: React.FC<InteractiveCardLinkProps> = ({ target, children, onClick }) => {
    const { cards } = useCardStore();
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const linkRef = useRef<HTMLAnchorElement>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const matchedCard = React.useMemo(() => {
        return cards.find(c => c.title.trim().toLowerCase() === target.trim().toLowerCase());
    }, [cards, target]);

    const handleMouseEnter = () => {
        if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
        hoverTimeout.current = setTimeout(() => {
            if (linkRef.current) {
                const rect = linkRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX
                });
            }
            setIsHovered(true);
        }, 300); // 300ms delay before showing popover
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        leaveTimeout.current = setTimeout(() => {
            setIsHovered(false);
        }, 200); // 200ms grace period to let user move mouse into popover
    };

    const popoverContent = matchedCard ? (
        <div 
            className="card-link-popover absolute z-[9999] w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 transition-all animate-in fade-in slide-in-from-top-2"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={() => {
                if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
                setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                {matchedCard.nodeType === 'concept' ? (
                    <Brain weight="duotone" className="text-purple-500" size={20} />
                ) : matchedCard.nodeType === 'flashcard' ? (
                    <Cards weight="duotone" className="text-green-500" size={20} />
                ) : (
                    <TextAa weight="duotone" className="text-blue-500" size={20} />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {matchedCard.nodeType}
                </span>
            </div>
            
            <h4 className="text-[1.05rem] font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                {matchedCard.title}
            </h4>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                {matchedCard.content || "Aucun contenu résumé."}
            </p>
            
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onClick) onClick(target);
                    setIsHovered(false);
                }}
                className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-semibold transition-colors"
            >
                Ouvrir la carte
            </button>
        </div>
    ) : (
        <div 
            className="card-link-popover absolute z-[9999] w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 transition-all animate-in fade-in slide-in-from-top-2"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={() => {
                if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
                setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-center gap-2 mb-2 text-amber-500">
                <Warning weight="fill" size={20} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                    Lien Orphelin
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
                La carte "{target}" est introuvable ou a été supprimée.
            </p>
        </div>
    );

    return (
        <>
            <a 
                ref={linkRef}
                href={`#internal:${target}`}
                className={`inline-flex items-center gap-1 font-semibold cursor-pointer border-b transition-colors no-underline px-1 rounded-sm ${matchedCard ? 'text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/30' : 'text-slate-500 border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                    e.preventDefault();
                    if (onClick) onClick(target);
                }}
            >
                {matchedCard?.nodeType === 'concept' && <Brain size={16} weight="duotone" className="opacity-70" />}
                {matchedCard?.nodeType === 'flashcard' && <Cards size={16} weight="duotone" className="opacity-70" />}
                {children}
            </a>

            {isHovered && createPortal(popoverContent, document.body)}
        </>
    );
};
