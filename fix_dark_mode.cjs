const fs = require('fs');
const path = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/ReviewSessionModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard dark mode ternary patterns
// e.g. ${darkMode ? 'dark-classes' : 'light-classes'} -> light-classes dark-classes
content = content.replace(/\$\{darkMode \? '([^']+)' : '([^']+)'\}/g, (match, dark, light) => {
    const darkClasses = dark.split(' ').map(c => `dark:${c}`).join(' ');
    return `${light} ${darkClasses}`;
});

// Also handle the string concatenation pattern: darkMode ? 'bg-slate-800' : 'bg-slate-100'
// Just in case it's not inside ${} but in an object map or something
// Wait, in my previous edit I used:
// const getActionClass = (rating: number, isDark: boolean) => {
//    if (rating === 1) return isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100';

content = content.replace(/isDark \? '([^']+)' : '([^']+)'/g, (match, dark, light) => {
    const darkClasses = dark.split(' ').map(c => `dark:${c}`).join(' ');
    return `'${light} ${darkClasses}'`;
});

content = content.replace(/const getActionClass = \(rating: number, isDark: boolean\) => \{/g, 'const getActionClass = (rating: number) => {');
content = content.replace(/getActionClass\(action\.rating, darkMode\)/g, 'getActionClass(action.rating)');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dark mode classes');
