import React, { createContext, useContext, useState, useEffect } from 'react';
import { CARD_COLORS as DEFAULT_CARD_COLORS, DEFAULT_CARD_ICONS } from '../theme';

// Define the shape of our context
interface ThemeContextType {
    categoryColors: Record<string, string>;
    categoryIcons: Record<string, string>;
    setCategoryColor: (type: string, color: string) => void;
    setCategoryIcon: (type: string, iconName: string) => void;
    resetCategoryColors: () => void;
    resetCategoryIcons: () => void;
    getCategoryColor: (type: string) => string;
    getCategoryIcon: (type: string) => string;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_COLORS = 'pharmabrain_theme_colors';
const STORAGE_KEY_ICONS = 'pharmabrain_theme_icons';
const STORAGE_KEY_DARK = 'pharmabrain_dark_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize dark mode
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY_DARK) === 'true';
        } catch (e) {
            return false;
        }
    });

    // Apply dark class to html element
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        try {
            localStorage.setItem(STORAGE_KEY_DARK, String(darkMode));
        } catch (e) {
            console.error('Failed to save dark mode preference', e);
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    // Initialize state for Colors
    const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_COLORS);
            if (stored) {
                return { ...DEFAULT_CARD_COLORS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load theme colors', e);
        }
        return { ...DEFAULT_CARD_COLORS };
    });

    // Initialize state for Icons
    const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_ICONS);
            if (stored) {
                return { ...DEFAULT_CARD_ICONS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load theme icons', e);
        }
        return { ...DEFAULT_CARD_ICONS };
    });

    // Save Colors to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(categoryColors));
        } catch (e) {
            console.error('Failed to save theme colors', e);
        }
    }, [categoryColors]);

    // Save Icons to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_ICONS, JSON.stringify(categoryIcons));
        } catch (e) {
            console.error('Failed to save theme icons', e);
        }
    }, [categoryIcons]);


    const setCategoryColor = (type: string, color: string) => {
        setCategoryColors(prev => ({
            ...prev,
            [type]: color
        }));
    };

    const setCategoryIcon = (type: string, iconName: string) => {
        setCategoryIcons(prev => ({
            ...prev,
            [type]: iconName
        }));
    };


    const resetCategoryColors = () => {
        setCategoryColors({ ...DEFAULT_CARD_COLORS });
        localStorage.removeItem(STORAGE_KEY_COLORS);
    };

    const resetCategoryIcons = () => {
        setCategoryIcons({ ...DEFAULT_CARD_ICONS });
        localStorage.removeItem(STORAGE_KEY_ICONS);
    };

    // Helper to get color
    const getCategoryColor = (type: string): string => {
        if (categoryColors[type]) {
            return categoryColors[type];
        }
        // Fallback generation for dynamic types
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 65%, 45%)`;
    };

    // Helper to get icon
    const getCategoryIcon = (type: string): string => {
        if (categoryIcons[type]) {
            return categoryIcons[type];
        }
        return 'FileText'; // Default fallback icon
    };

    return (
        <ThemeContext.Provider value={{
            categoryColors,
            categoryIcons,
            setCategoryColor,
            setCategoryIcon,
            resetCategoryColors,
            resetCategoryIcons,
            getCategoryColor,
            getCategoryIcon,
            darkMode,
            toggleDarkMode
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
