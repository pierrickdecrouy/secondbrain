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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PhosphorIcon = (PhosphorIcons as any)[name];

    if (!PhosphorIcon) {
        return <PhosphorIcons.FileText size={size} className={className} {...props} />;
    }

    return <PhosphorIcon size={size} className={className} {...props} />;
};
