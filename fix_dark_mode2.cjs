const fs = require('fs');
const path = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/ReviewSessionModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace THEME MAPS
const themeMapReplacement = `const THEME_MAP: Record<string, { bubble: string, text: string, bg: string, tag: string }> = {
    drug: { bubble: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/5', tag: 'bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
    patho: { bubble: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-400/5', tag: 'bg-red-100 dark:bg-red-400/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20' },
    physio: { bubble: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-400/5', tag: 'bg-indigo-100 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' },
    data: { bubble: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-400/5', tag: 'bg-orange-100 dark:bg-orange-400/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20' }
};`;

content = content.replace(/const LIGHT_THEME_MAP[\s\S]*?const DARK_THEME_MAP[\s\S]*?\};/, themeMapReplacement);
content = content.replace(/const themeMap = darkMode \? DARK_THEME_MAP : LIGHT_THEME_MAP;\n\s*const theme = themeMap\[category\] \|\| themeMap\.drug;/, 'const theme = THEME_MAP[category] || THEME_MAP.drug;');

// Custom regex to handle nested ternaries like:
// showStats ? (darkMode ? 'dark1' : 'light1') : (darkMode ? 'dark2' : 'light2')
// We'll just replace the inner (darkMode ? 'dark' : 'light') manually
content = content.replace(/\(darkMode \? '([^']+)' : '([^']+)'\)/g, (match, dark, light) => {
    const darkClasses = dark.split(' ').map(c => `dark:${c}`).join(' ');
    return `'${light} ${darkClasses}'`;
});

// Replace remaining single darkMode ? '...' : '...'
content = content.replace(/darkMode \? '([^']+)' : '([^']+)'/g, (match, dark, light) => {
    if (light === '') return `'dark:${dark}'`;
    const darkClasses = dark.split(' ').map(c => `dark:${c}`).join(' ');
    return `'${light} ${darkClasses}'`;
});

content = content.replace(/className={darkMode \? 'text-emerald-400' : 'text-emerald-500'}/g, "className='text-emerald-500 dark:text-emerald-400'");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed nested dark mode classes');
