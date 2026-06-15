const fs = require('fs');
const path = './src/components/CardForm.css';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  '#f8fafc': 'var(--color-bg)',
  '#f1f5f9': 'var(--color-bg)',
  '#cbd5e1': 'var(--color-border)',
  '#e2e8f0': 'var(--color-border)',
  '#1e293b': 'var(--color-text)',
  '#334155': 'var(--color-text)',
  '#64748b': 'var(--color-text-muted)',
  '#94a3b8': 'var(--color-text-muted)',
  'white': 'var(--color-surface)',
  '#0f172a': 'var(--color-primary)',
  '#475569': 'var(--color-text)'
};

content = content.replace(/background:\s*white;/g, 'background: var(--color-surface);');
content = content.replace(/background-color:\s*white;/g, 'background-color: var(--color-surface);');
content = content.replace(/color:\s*white;/g, 'color: #ffffff;'); // preserve button text

for (const [hex, cssVar] of Object.entries(replacements)) {
  if (hex === 'white') continue;
  const regex = new RegExp(hex, 'gi');
  content = content.replace(regex, cssVar);
}

fs.writeFileSync(path, content);
console.log('CSS updated');
