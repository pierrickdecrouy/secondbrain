const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  { regex: /bg-\[color:var\(--color-bg\)\]/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
  { regex: /bg-\[color:var\(--color-surface\)\]/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /bg-\[color:var\(--color-surface-hover\)\]/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  // Text
  { regex: /text-\[color:var\(--color-text\)\]/g, replacement: 'text-slate-900 dark:text-slate-100' },
  { regex: /text-\[color:var\(--color-text-muted\)\]/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-\[color:var\(--color-primary\)\]/g, replacement: 'text-teal-600 dark:text-teal-400' },
  { regex: /text-\[color:var\(--color-primary-hover\)\]/g, replacement: 'text-teal-700 dark:text-teal-300' },
  // Borders
  { regex: /border-\[color:var\(--color-border\)\]/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /border-\[color:var\(--color-primary\)\]/g, replacement: 'border-teal-600 dark:border-teal-500' },
  // Rings/Shadows (special cases)
  { regex: /ring-\[color:var\(--color-primary\)\]/g, replacement: 'ring-teal-600 dark:ring-teal-500' },
  { regex: /shadow-\[color:var\(--color-primary\)\]/g, replacement: 'shadow-teal-500/20 dark:shadow-teal-900/20' },
  // Other colors like success, danger etc.
  { regex: /bg-\[color:var\(--color-success\)\]/g, replacement: 'bg-emerald-500' },
  { regex: /text-\[color:var\(--color-success\)\]/g, replacement: 'text-emerald-600 dark:text-emerald-400' },
  { regex: /text-\[color:var\(--color-danger\)\]/g, replacement: 'text-red-600 dark:text-red-400' },
  { regex: /text-\[color:var\(--color-warning\)\]/g, replacement: 'text-amber-600 dark:text-amber-400' },
  { regex: /bg-\[color:var\(--color-primary\)\]/g, replacement: 'bg-teal-600 dark:bg-teal-500' },
  { regex: /hover:bg-\[color:var\(--color-primary-hover\)\]/g, replacement: 'hover:bg-teal-700 dark:hover:bg-teal-400' }
];

const fileList = fs.readFileSync('scratch/files_to_convert.txt', 'utf8').split('\n').filter(Boolean);

let modifiedFiles = 0;

fileList.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  replacements.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Migration complete. Modified ${modifiedFiles} files.`);
