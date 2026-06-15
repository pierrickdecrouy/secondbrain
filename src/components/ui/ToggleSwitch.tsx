import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false
}) => {
    return (
        <div className={`toggle-switch-container ${disabled ? 'disabled' : ''}`}>
            <div className="toggle-switch-text">
                {label && <div className="toggle-switch-label">{label}</div>}
                {description && <div className="toggle-switch-description">{description}</div>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={`toggle-switch ${checked ? 'checked' : ''}`}
                onClick={() => !disabled && onChange(!checked)}
            >
                <span className="toggle-switch-thumb" />
            </button>
        </div>
    );
};
