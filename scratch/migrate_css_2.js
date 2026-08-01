const fs = require('fs');
const path = require('path');

const fileList = fs.readFileSync('scratch/files_to_convert.txt', 'utf8').split('\n').filter(Boolean);

let modifiedFiles = 0;

fileList.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Dynamic replacement for ALL Tailwind arbitrary values using [color:var(--color-XXX)]
  const regex = /([a-z0-9-]+)-\[color:var\(--color-([a-z0-9-]+)\)\]/g;
  
  content = content.replace(regex, (match, utility, colorVar) => {
    hasChanges = true;
    let baseColor = 'slate-500';
    let darkColor = 'slate-400';
    
    // Map colors
    if (colorVar === 'bg' || colorVar === 'surface') {
        baseColor = colorVar === 'bg' ? 'slate-50' : 'white';
        darkColor = colorVar === 'bg' ? 'slate-950' : 'slate-900';
    } else if (colorVar === 'surface-hover') {
        baseColor = 'slate-100'; darkColor = 'slate-800';
    } else if (colorVar === 'surface-active') {
        baseColor = 'slate-200'; darkColor = 'slate-700';
    } else if (colorVar === 'text') {
        baseColor = 'slate-900'; darkColor = 'slate-100';
    } else if (colorVar === 'text-muted') {
        baseColor = 'slate-500'; darkColor = 'slate-400';
    } else if (colorVar === 'border') {
        baseColor = 'slate-200'; darkColor = 'slate-700';
    } else if (colorVar === 'primary') {
        baseColor = 'teal-600'; darkColor = 'teal-500';
    } else if (colorVar === 'primary-hover') {
        baseColor = 'teal-700'; darkColor = 'teal-400';
    } else if (colorVar === 'success') {
        baseColor = 'emerald-600'; darkColor = 'emerald-500';
    } else if (colorVar === 'danger') {
        baseColor = 'red-600'; darkColor = 'red-500';
    } else if (colorVar === 'warning') {
        baseColor = 'amber-600'; darkColor = 'amber-500';
    }
    
    // Some utilities map slightly differently
    if (utility === 'bg') {
        return `bg-${baseColor} dark:bg-${darkColor}`;
    } else if (utility === 'text') {
        return `text-${baseColor} dark:text-${darkColor}`;
    } else if (utility === 'border') {
        return `border-${baseColor} dark:border-${darkColor}`;
    } else if (utility === 'placeholder') {
        return `placeholder-${baseColor} dark:placeholder-${darkColor}`;
    } else if (utility === 'ring') {
        return `ring-${baseColor} dark:ring-${darkColor}`;
    } else if (utility === 'fill') {
        return `fill-${baseColor} dark:fill-${darkColor}`;
    } else if (utility === 'stroke') {
        return `stroke-${baseColor} dark:stroke-${darkColor}`;
    }
    
    return `${utility}-${baseColor} dark:${utility}-${darkColor}`;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Migration 2 complete. Modified ${modifiedFiles} files.`);
