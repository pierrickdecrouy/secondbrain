import React, { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';

export interface DropdownItem {
    id: string;
    label: string | React.ReactNode;
    icon?: React.ReactNode;
    colorClass?: string;
}

interface DropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownItem[];
    placeholder?: string | React.ReactNode;
    renderTrigger?: (selectedItem?: DropdownItem, isOpen?: boolean) => React.ReactNode;
    renderOption?: (item: DropdownItem) => React.ReactNode;
    className?: string;
    dropdownClassName?: string;
    onClear?: () => void;
    showClearButton?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Sélectionner...',
    renderTrigger,
    renderOption,
    className = '',
    dropdownClassName = '',
    onClear,
    showClearButton = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < options.length) {
                    onChange(options[focusedIndex].id);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    useEffect(() => {
        if (isOpen) {
            const index = options.findIndex(o => o.id === value);
            setFocusedIndex(index >= 0 ? index : 0);
        } else {
            setFocusedIndex(-1);
        }
    }, [isOpen, value, options]);

    const selectedItem = options.find(o => o.id === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
            {renderTrigger ? (
                <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                    {renderTrigger(selectedItem, isOpen)}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm transition-all outline-none cursor-pointer ${value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <span className="text-sm font-bold flex-1 text-left truncate">
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                    {showClearButton && value ? (
                        <div
                            className="ml-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded p-0.5"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClear) onClear();
                            }}
                        >
                            &times;
                        </div>
                    ) : (
                        <CaretDown size={14} weight="bold" className="text-slate-400" />
                    )}
                </button>
            )}

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-2 min-w-[240px] max-h-[300px] overflow-y-auto flex flex-col gap-1 custom-scrollbar w-full sm:w-auto ${dropdownClassName}`}>
                        {options.length === 0 ? (
                            <div className="text-xs text-slate-500 text-center py-4">Aucune option</div>
                        ) : (
                            options.map((option, index) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-left w-full ${focusedIndex === index ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    {renderOption ? (
                                        renderOption(option)
                                    ) : (
                                        <>
                                            {option.icon && <div className={option.colorClass}>{option.icon}</div>}
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate uppercase tracking-wider">{option.label}</span>
                                        </>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
