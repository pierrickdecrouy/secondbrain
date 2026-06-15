// @ts-nocheck
import React from 'react';
import { Brain, Link as LinkIcon, ArrowsLeftRight, Hand, Trash, ArrowsMerge } from '@phosphor-icons/react';
import './NetworkTooltip.css';

interface NetworkTooltipProps {
    link: Record<string, unknown>; // Using Record for Link object as seen in NetworkView usage
    onReportIncorrect?: () => void;
}

export const NetworkTooltip: React.FC<NetworkTooltipProps> = ({ link, onReportIncorrect }) => {
    // 1. Determine Type & Style
    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'explicit':
                return { label: 'Référence', className: 'reference', icon: LinkIcon };
            case 'hybrid':
                return { label: 'Hybride', className: 'hybrid', icon: ArrowsMerge };
            case 'manual':
                return { label: 'Manuel', className: 'manual', icon: Hand };
            case 'semantic':
            default:
                return { label: 'Sémantique', className: 'semantic', icon: Brain };
        }
    };

    const typeDetails = getTypeDetails(link.type || 'semantic');
    const TypeIcon = typeDetails.icon;

    // 2. Score Calculation
    const score = Math.round((link.value || 0) * 100);

    // Color scale for progress bar
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'linear-gradient(90deg, #10b981, #34d399)'; // Emerald
        if (s >= 50) return 'linear-gradient(90deg, #f59e0b, #fbbf24)'; // Amber
        return 'linear-gradient(90deg, #ef4444, #f87171)'; // Red
    };

    const sourceName = typeof link.source === 'object' ? (link.source as any).name : link.source;
    const targetName = typeof link.target === 'object' ? (link.target as any).name : link.target;

    return (
        <div className="network-tooltip-container animate-in fade-in zoom-in-95 duration-200">
            <div className="network-tooltip-card shadow-2xl border border-[var(--color-border)]">
                <div className="flex flex-col" style={{ padding: "12px 16px" }}>
                    
                    {/* Header: Type and Action */}
                    <div className="flex items-center justify-between mb-2">
                        <div className={`network-tooltip-badge ${typeDetails.className}`}>
                            <TypeIcon size={12} weight="bold" />
                            <span>{typeDetails.label}</span>
                        </div>
                        {onReportIncorrect && (
                            <button 
                                onClick={onReportIncorrect}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Signaler ce lien comme incorrect"
                            >
                                <Trash size={14} weight="fill" />
                            </button>
                        )}
                    </div>

                    {/* Nodes relationship */}
                    <div className="flex items-center justify-between gap-4 py-2 text-[15px] font-bold">
                        <span className="text-slate-800 dark:text-slate-100 text-right leading-tight break-words text-sm" style={{ flex: '0 1 auto' }} title={sourceName}>{sourceName}</span>
                        <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800">
                            <ArrowsLeftRight size={12} className="text-slate-400 dark:text-slate-500" weight="bold" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100 text-left leading-tight break-words text-sm" style={{ flex: '0 1 auto' }} title={targetName}>{targetName}</span>
                    </div>

                    {/* Confidence Score */}
                    <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Force du lien</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
                            <div 
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${score}%`, background: getScoreColor(score) }}
                            />
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};
