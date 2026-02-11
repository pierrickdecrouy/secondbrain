import React from 'react';
import * as Icons from 'lucide-react';

export const AVAILABLE_ICONS = [
    'Pill',
    'Activity',
    'Biohazard',
    'Database',
    'Stethoscope',
    'Heart',
    'Brain',
    'Dna',
    'Syringe',
    'Thermometer',
    'Beaker',
    'FileText',
    'Zap',
    'FlaskConical'
];

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
    className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 24, className, ...props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LucideIcon = (Icons as any)[name];

    if (!LucideIcon) {
        // Fallback
        return <Icons.FileText size={size} className={className} {...props} />;
    }

    return <LucideIcon size={size} className={className} {...props} />;
};
