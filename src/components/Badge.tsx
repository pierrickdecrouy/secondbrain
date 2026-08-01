import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';
import { getTypeColor } from '../theme';

interface BadgeProps {
    type: string;
    className?: string;
}

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const Badge: React.FC<BadgeProps> = ({ type, className }) => {
    const { getCategoryIcon, getCategoryColor } = useTheme();
    const iconName = getCategoryIcon(type);
    const color = getCategoryColor ? getCategoryColor(type) : getTypeColor(type);

    return (
        <span
            key={`badge-${type}`}
            className={`${className || ''} badge-style-1`}
            data-type={type}
            style={{
  backgroundColor: hexToRgba(color, 0.12),
  color: color
}}
        >
            <DynamicIcon name={iconName} size={14} weight="fill" />
            <span>{type}</span>
        </span>
    );
};
