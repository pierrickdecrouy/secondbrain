import React from 'react';
import { DynamicIcon } from './DynamicIcon';
import type { AvatarConfig } from '../store/useUIStore';

interface AvatarProps {
    config: AvatarConfig;
    userName: string;
    photoURL?: string | null;
    className?: string;
    style?: React.CSSProperties;
    defaultBg?: string; // used when auto (initials) without photo
    defaultTextColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
    config, 
    userName, 
    photoURL, 
    className = "", 
    style = {},
    defaultBg = "bg-emerald-50 dark:bg-emerald-900/30",
    defaultTextColor = "text-emerald-600"
}) => {
    
    // Type 'auto' (Google Photo or Initials)
    if (config.type === 'auto') {
        if (photoURL) {
            return (
                <img 
                    src={photoURL} 
                    alt="Profile" 
                    className={`rounded-full object-cover shrink-0 ${className}`} 
                    style={style}
                />
            );
        }
        return (
            <div 
                className={`rounded-full flex items-center justify-center font-bold shrink-0 ${defaultBg} ${defaultTextColor} ${className}`}
                style={style}
            >
                {userName.charAt(0).toUpperCase()}
            </div>
        );
    }
    
    // Type 'gradient'
    if (config.type === 'gradient') {
        return (
            <div 
                className={`rounded-full shrink-0 ${className}`}
                style={{ ...style, background: config.value }}
            />
        );
    }

    // Type 'dicebear'
    if (config.type === 'dicebear') {
        return (
            <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${config.value}&backgroundColor=transparent`}
                alt="Avatar" 
                className={`rounded-full object-cover shrink-0 bg-slate-100 dark:bg-slate-800 ${className}`}
                style={style}
            />
        );
    }

    // Type 'icon'
    if (config.type === 'icon') {
        return (
            <div 
                className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
                style={{ ...style, background: `${config.color}15`, color: config.color }}
            >
                <DynamicIcon name={config.value || 'User'} size={style.width ? (typeof style.width === 'number' ? style.width * 0.5 : '50%') : 20} weight="fill" />
            </div>
        );
    }

    return null;
};
