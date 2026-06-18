const fs = require('fs');

const indexCssPath = './src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

if (!indexCss.includes('--color-success')) {
  // Add variables to :root
  indexCss = indexCss.replace(
    /--color-border: #e2e8f0;/,
    `--color-border: #e2e8f0;
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;`
  );

  // Add variables to .dark
  indexCss = indexCss.replace(
    /--color-border: #334155;/,
    `--color-border: #334155;
  --color-success: #34d399;
  --color-success-bg: rgba(16, 185, 129, 0.15);
  --color-warning: #fbbf24;
  --color-warning-bg: rgba(245, 158, 11, 0.15);
  --color-danger: #f87171;
  --color-danger-bg: rgba(239, 68, 68, 0.15);`
  );
  
  fs.writeFileSync(indexCssPath, indexCss);
}

// Replace in components
function replaceHexInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content
    .replace(/#10b981/gi, 'var(--color-success)')
    .replace(/#ecfdf5/gi, 'var(--color-success-bg)')
    .replace(/#047857/gi, 'var(--color-success)')
    .replace(/#f59e0b|#d97706|#f97316/gi, 'var(--color-warning)')
    .replace(/#fff7ed|#fffbeb/gi, 'var(--color-warning-bg)')
    .replace(/#ef4444|#dc2626|#be123c/gi, 'var(--color-danger)')
    .replace(/#fef2f2|#fee2e2|#fff1f2/gi, 'var(--color-danger-bg)');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

replaceHexInFile('./src/components/BrowsePage.tsx');
replaceHexInFile('./src/components/CourseEditor.tsx');
replaceHexInFile('./src/components/CourseViewer.tsx');
replaceHexInFile('./src/components/SettingsPage.tsx');
console.log('Colors updated');
