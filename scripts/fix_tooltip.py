import re

with open('src/components/NetworkTooltip.tsx', 'w') as f:
    f.write("""import React from 'react';
import { Brain, Link as LinkIcon, ArrowsLeftRight, Hand, Trash, ArrowsMerge } from '@phosphor-icons/react';
import './NetworkTooltip.css';

interface NetworkTooltipProps {
    link: any; // Using any for Link object as seen in NetworkView usage
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
            <div className="network-tooltip-card shadow-xl border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex flex-col p-4">
                    
                    {/* Header: Type and Action */}
                    <div className="flex items-center justify-between mb-4">
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
                    <div className="flex items-center justify-between gap-3 text-[14px] font-bold">
                        <span className="flex-1 text-slate-800 dark:text-slate-100 text-right leading-tight" title={sourceName}>{sourceName}</span>
                        <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800">
                            <ArrowsLeftRight size={14} className="text-slate-400 dark:text-slate-500" weight="bold" />
                        </div>
                        <span className="flex-1 text-slate-800 dark:text-slate-100 text-left leading-tight" title={targetName}>{targetName}</span>
                    </div>

                    {/* Confidence Score */}
                    <div className="mt-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Force du lien</span>
                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300">{score}%</span>
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
""")

with open('src/components/NetworkTooltip.css', 'w') as f:
    f.write("""/* NetworkTooltip.css */

/* Keyframes for the floating animation */
@keyframes tooltipFloat {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
}

.network-tooltip-container {
    width: 280px;
    animation: tooltipFloat 5s ease-in-out infinite;
    pointer-events: auto; /* Ensure clicks work */
}

.network-tooltip-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 16px;
    overflow: hidden;
}

html.dark .network-tooltip-card {
    background: rgba(15, 23, 42, 0.95);
}

.network-tooltip-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-radius: 8px;
}

/* Badge Variants */
.network-tooltip-badge.semantic {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
    color: #9333ea;
    border: 1px solid rgba(168, 85, 247, 0.2);
}
html.dark .network-tooltip-badge.semantic { color: #d8b4fe; border-color: rgba(216, 180, 254, 0.2); }

.network-tooltip-badge.reference {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
    color: #4f46e5;
    border: 1px solid rgba(99, 102, 241, 0.2);
}
html.dark .network-tooltip-badge.reference { color: #c7d2fe; border-color: rgba(199, 210, 254, 0.2); }

.network-tooltip-badge.hybrid {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05));
    color: #0891b2;
    border: 1px solid rgba(6, 182, 212, 0.2);
}
html.dark .network-tooltip-badge.hybrid { color: #67e8f9; border-color: rgba(103, 232, 249, 0.2); }

.network-tooltip-badge.manual {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.2);
}
html.dark .network-tooltip-badge.manual { color: #fcd34d; border-color: rgba(252, 211, 77, 0.2); }
""")

