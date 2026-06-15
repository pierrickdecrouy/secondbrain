import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';
import { getTypeColor } from '../theme';

interface BadgeProps {
    type: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, className }) => {
    const { getCategoryIcon, getCategoryColor } = useTheme();
    const iconName = getCategoryIcon(type);

    // Use context color if available, fallback to theme util
    const color = getCategoryColor ? getCategoryColor(type) : getTypeColor(type);

    const style = {
        backgroundColor: color,
        color: 'white',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
    };

    return (
        <span
            key={`badge-${type}`}
            className={`card-badge ${className || ''}`}
            data-type={type}
            style={style}
        >
            <DynamicIcon name={iconName} size={12} />
            <span>{type.toUpperCase()}</span>
        </span>
    );
};
