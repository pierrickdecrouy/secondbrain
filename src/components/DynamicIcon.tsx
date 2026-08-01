import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import './styles/DynamicIcon.css';

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

interface DynamicIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
    name: string;
    size?: number | string;
    className?: string;
    weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 24, className, ...props }) => {
    const PhosphorIcon = (PhosphorIcons as unknown as Record<string, React.ElementType>)[name];

    if (!PhosphorIcon) {
        return (
            <span key="FileText" className="dynamicicon-style-1" >
                <PhosphorIcons.FileText size={size} className={className} {...props} />
            </span>
        );
    }

    return (
        <span key={name} className="dynamicicon-style-2" >
            <PhosphorIcon size={size} className={className} {...props} />
        </span>
    );
};
