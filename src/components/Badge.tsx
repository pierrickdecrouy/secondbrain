import { Pill, Activity, Zap, BarChart3 } from 'lucide-react';
import type { CardType } from '../types';

interface BadgeProps {
    type: CardType;
    className?: string;
}

const typeConfig: Record<CardType, { label: string; icon: React.ElementType }> = {
    drug: { label: 'DRUG', icon: Pill },
    patho: { label: 'PATHO', icon: Activity },
    physio: { label: 'PHYSIO', icon: Zap },
    data: { label: 'DATA', icon: BarChart3 }
};

export const Badge: React.FC<BadgeProps> = ({ type, className }) => {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <span className={`card-badge ${className || ''}`} data-type={type}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};
