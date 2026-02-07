import { Pill, Activity, Zap, BarChart3, Tag } from 'lucide-react';
import { getTypeColor } from '../theme';

interface BadgeProps {
    type: string;
    className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
    drug: Pill,
    patho: Activity,
    physio: Zap,
    data: BarChart3
};

export const Badge: React.FC<BadgeProps> = ({ type, className }) => {
    const Icon = typeIcons[type] || Tag;
    const color = getTypeColor(type);

    // Convert hex/hsl to background/text if needed, or use inline styles
    // For now, let's use inline styles for the dynamic color
    const style = {
        backgroundColor: color,
        color: 'white',
        fontWeight: 600,
    };

    return (
        <span
            className={`card-badge ${className || ''}`}
            data-type={type}
            style={style}
        >
            <Icon size={12} />
            {type.toUpperCase()}
        </span>
    );
};
