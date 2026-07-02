import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';

export const AVAILABLE_ICONS = [
    'Pill',
    'ChartLine',
    'Database',
    'Stethoscope',
    'Heart',
    'Brain',
    'DnaStrand',
    'Syringe',
    'Thermometer',
    'Flask',
    'FileText',
    'Lightning',
    'TestTube',
    'Atom'
];

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 24, className, ...props }) => {
    const PhosphorIcon = (PhosphorIcons as unknown as Record<string, React.ElementType>)[name];

    if (!PhosphorIcon) {
        return (
            <span key="FileText" style={{ display: 'contents' }}>
                <PhosphorIcons.FileText size={size} className={className} {...props} />
            </span>
        );
    }

    return (
        <span key={name} style={{ display: 'contents' }}>
            <PhosphorIcon size={size} className={className} {...props} />
        </span>
    );
};
