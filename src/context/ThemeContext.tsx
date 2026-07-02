import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CARD_COLORS as DEFAULT_CARD_COLORS, DEFAULT_CARD_ICONS } from '../theme';
import { loadSettingAsync, loadSettingSync, removeSettingAsync, saveSettingAsync } from '../persistentSettings';

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
    themeMode: 'light' | 'dark' | 'system';
    setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_COLORS = 'pharmabrain_theme_colors';
const STORAGE_KEY_ICONS = 'pharmabrain_theme_icons';
const STORAGE_KEY_THEME_MODE = 'pharmabrain_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>(() => {
        const stored = loadSettingSync<string>(STORAGE_KEY_THEME_MODE, 'system');
        return (stored as 'light' | 'dark' | 'system') || 'system';
    });

    const [darkMode, setDarkMode] = useState<boolean>(false);

    useEffect(() => {
        loadSettingAsync<string>(STORAGE_KEY_THEME_MODE, 'system').then(stored => {
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setThemeModeState(stored);
            }
        });
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            let isDark = false;
            if (themeMode === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                isDark = themeMode === 'dark';
            }
            setDarkMode(isDark);
            document.documentElement.classList.toggle('dark', isDark);
            saveSettingAsync(STORAGE_KEY_THEME_MODE, themeMode);
        };

        applyTheme();

        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [themeMode]);

    const setThemeMode = (mode: 'light' | 'dark' | 'system') => {
        setThemeModeState(mode);
    };

    // Initialize state for Colors
    const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => {
        const stored = loadSettingSync<Record<string, string> | null>(STORAGE_KEY_COLORS, null);
        if (stored) {
            return { ...DEFAULT_CARD_COLORS, ...stored };
        }
        return { ...DEFAULT_CARD_COLORS };
    });

    // Initialize state for Icons
    const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
        const stored = loadSettingSync<Record<string, string> | null>(STORAGE_KEY_ICONS, null);
        if (stored) {
            return { ...DEFAULT_CARD_ICONS, ...stored };
        }
        return { ...DEFAULT_CARD_ICONS };
    });

    useEffect(() => {
        loadSettingAsync<Record<string, string> | null>(STORAGE_KEY_COLORS, null).then((stored) => {
            if (stored) setCategoryColors({ ...DEFAULT_CARD_COLORS, ...stored });
        });
        loadSettingAsync<Record<string, string> | null>(STORAGE_KEY_ICONS, null).then((stored) => {
            if (stored) setCategoryIcons({ ...DEFAULT_CARD_ICONS, ...stored });
        });
    }, []);

    // Save Colors to localStorage
    useEffect(() => {
        saveSettingAsync(STORAGE_KEY_COLORS, categoryColors);
    }, [categoryColors]);

    // Save Icons to localStorage
    useEffect(() => {
        saveSettingAsync(STORAGE_KEY_ICONS, categoryIcons);
    }, [categoryIcons]);


    const setCategoryColor = useCallback((type: string, color: string) => {
        setCategoryColors(prev => ({
            ...prev,
            [type]: color
        }));
    }, []);

    const setCategoryIcon = useCallback((type: string, iconName: string) => {
        setCategoryIcons(prev => ({
            ...prev,
            [type]: iconName
        }));
    }, []);


    const resetCategoryColors = useCallback(() => {
        setCategoryColors({ ...DEFAULT_CARD_COLORS });
        removeSettingAsync(STORAGE_KEY_COLORS);
    }, []);

    const resetCategoryIcons = useCallback(() => {
        setCategoryIcons({ ...DEFAULT_CARD_ICONS });
        removeSettingAsync(STORAGE_KEY_ICONS);
    }, []);

    // Helper to get color
    const getCategoryColor = useCallback((type: string): string => {
        if (categoryColors[type]) {
            return categoryColors[type];
        }
        // Fallback generation for dynamic types
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        const s = 0.65;
        const l = 0.45;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
        const toHex = (n: number) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }, [categoryColors]);

    // Helper to get icon
    const getCategoryIcon = useCallback((type: string): string => {
        if (categoryIcons[type]) {
            return categoryIcons[type];
        }
        return 'FileText'; // Default fallback icon
    }, [categoryIcons]);

    const contextValue = useMemo(() => ({
        categoryColors,
        categoryIcons,
        setCategoryColor,
        setCategoryIcon,
        resetCategoryColors,
        resetCategoryIcons,
        getCategoryColor,
        getCategoryIcon,
        darkMode,
        themeMode,
        setThemeMode
    }), [
        categoryColors, categoryIcons, setCategoryColor, setCategoryIcon,
        resetCategoryColors, resetCategoryIcons, getCategoryColor, getCategoryIcon,
        darkMode, themeMode
    ]);

    return (
        <ThemeContext.Provider value={contextValue}>
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
