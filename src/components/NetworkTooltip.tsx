import React from 'react';
import { Brain, Link as LinkIcon, ArrowsMerge, Hand, Lightning, Trash } from '@phosphor-icons/react';
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
                return { label: 'IA Sémantique', className: 'semantic', icon: Brain };
        }
    };

    const typeDetails = getTypeDetails(link.type || 'semantic');
    const TypeIcon = typeDetails.icon;

    // 2. Score Calculation
    const score = Math.round((link.value || 0) * 100);

    // Color scale for progress bar
    const getScoreColor = (s: number) => {
        if (s >= 80) return '#4ade80'; // Green-400
        if (s >= 50) return '#facc15'; // Yellow-400
        return '#f87171'; // Red-400
    };

    // 3. Dynamic Description Logic
    const sourceName = typeof link.source === 'object' ? (link.source as any).name : link.source;
    const targetName = typeof link.target === 'object' ? (link.target as any).name : link.target;

    const getDescription = () => {
        if (score >= 80) {
            return (
                <span>
                    Forte corrélation détectée entre <strong className="text-white">"{sourceName}"</strong> et <strong className="text-white">"{targetName}"</strong>.
                </span>
            );
        } else if (score >= 50) {
            return (
                <span>
                    Corrélation modérée entre <strong className="text-white">"{sourceName}"</strong> et <strong className="text-white">"{targetName}"</strong>.
                </span>
            );
        } else {
            return (
                <span>
                    Faible lien potentiel entre <strong className="text-white">"{sourceName}"</strong> et <strong className="text-white">"{targetName}"</strong>.
                </span>
            );
        }
    };

    return (
        <div className="network-tooltip-container">
            <div className="network-tooltip-card">

                {/* HEADERS */}
                <div className="network-tooltip-header">
                    <div className={`network-tooltip-badge ${typeDetails.className}`}>
                        <TypeIcon size={12} />
                        <span>{typeDetails.label}</span>
                    </div>

                    <div className="network-tooltip-score">
                        <div className="network-tooltip-progress-track">
                            <div
                                className="network-tooltip-progress-fill"
                                style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}
                            />
                        </div>
                        <span className="network-tooltip-score-text">{score}%</span>
                    </div>
                </div>

                {/* BODY */}
                <div className="network-tooltip-body">
                    <Lightning size={16} className="text-yellow-400 shrink-0 mt-0.5" fill="currentColor" />
                    <div>
                        {getDescription()}
                    </div>
                </div>

                {/* FOOTER */}
                {onReportIncorrect && (
                    <div className="network-tooltip-footer">
                        <button className="network-tooltip-btn-feedback" onClick={onReportIncorrect}>
                            <Trash size={13} />
                            <span>Signaler comme incorrect</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
