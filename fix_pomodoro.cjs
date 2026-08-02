const fs = require('fs');
const path = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/PomodoroModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the inline style for backdrop
content = content.replace(
    /style=\{\{\s*background: t\.backdrop\s*\}\}/g,
    `className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[pomo-backdrop-in_0.25s_ease] backdrop-blur-[24px] bg-slate-900/45 dark:bg-slate-950/75"`
);
content = content.replace(
    /className="fixed inset-0 z-\[9999\] flex items-center justify-center p-4 animate-\[pomo-backdrop-in_0.25s_ease\] backdrop-blur-\[24px\]"\s*/g,
    ''
);

// Replace Card styles
content = content.replace(
    /style=\{\{\s*background: t\.card,\s*border: \`1px solid \$\{t\.cardBorder\}\`,\s*boxShadow: t\.cardShadow,\s*\}\}/g,
    `className="relative w-full max-w-[360px] rounded-[28px] overflow-hidden animate-[pomo-card-in_0.3s_cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-br from-white to-slate-50 border border-black/5 shadow-[0_24px_64px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)] dark:from-slate-900 dark:to-[#0a111f] dark:border-white/10 dark:shadow-[0_32px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"`
);
content = content.replace(
    /className="relative w-full max-w-\[360px\] rounded-\[28px\] overflow-hidden animate-\[pomo-card-in_0.3s_cubic-bezier\(0\.16,1,0\.3,1\)\]"\s*/g,
    ''
);

// Replace Tab styles
content = content.split(`style={{
  background: active ? activeBg : 'transparent',
  color: active ? activeColor : inactiveColor
}}`).join(`className={\`flex-1 py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 relative border-none \${active ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none' : 'bg-transparent text-slate-400 dark:text-white/35'} pomodoromodal-style-3\`}`);
content = content.replace(
    /className=\{\`flex-1 py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 relative border-none \$\{active && !darkMode \? 'shadow-sm' : ''\} pomodoromodal-style-3\`\}\s*/g,
    ''
);

// Replace inline text colors
content = content.replace(/style=\{\{\s*color: t\.textPrimary\s*\}\}/g, 'className="text-slate-900 dark:text-white"');
content = content.replace(/style=\{\{\s*color: t\.textSub\s*\}\}/g, 'className="text-slate-300 dark:text-white/20"');
content = content.replace(/style=\{\{\s*color: t\.textMuted\s*\}\}/g, 'className="text-slate-400 dark:text-white/35"');

// SettingsSlider track
content = content.replace(/const trackBg = darkMode \? 'rgba\(255,255,255,0\.1\)' : 'rgba\(0,0,0,0\.07\)';/g, '');
content = content.replace(/const thumbBg = darkMode \? '#ffffff' : '#ffffff';/g, '');
content = content.split(`style={{ background: trackBg }}`).join(`className="relative h-[3px] rounded-full bg-black/5 dark:bg-white/10"`);
content = content.replace(/className="relative h-\[3px\] rounded-full"\s*/g, '');

// SettingsSlider label/value colors
content = content.replace(/const labelColor = darkMode \? 'rgba\(255,255,255,0\.55\)' : '#64748b';/g, '');
content = content.replace(/const valueColor = darkMode \? '#ffffff' : '#0f172a';/g, '');
content = content.replace(/const unitColor = darkMode \? 'rgba\(255,255,255,0\.4\)' : '#94a3b8';/g, '');

content = content.split(`style={{ color: labelColor }}`).join(`className="text-[13px] font-medium tracking-[0.02em] text-slate-500 dark:text-white/55"`);
content = content.replace(/className="text-\[13px\] font-medium tracking-\[0\.02em\]"\s*/g, '');

content = content.split(`style={{ color: valueColor }}`).join(`className="text-[15px] font-bold font-mono tabular-nums text-slate-900 dark:text-white"`);
content = content.replace(/className="text-\[15px\] font-bold font-mono tabular-nums"\s*/g, '');

content = content.split(`style={{ color: unitColor }}`).join(`className="text-[11px] font-medium ml-0.5 text-slate-400 dark:text-white/40"`);
content = content.replace(/className="text-\[11px\] font-medium ml-0\.5"\s*/g, '');

// SettingsSlider thumb inline shadow
content = content.split("boxShadow: `0 0 0 3px ${color}60, 0 2px 6px rgba(0,0,0,${darkMode ? 0.3 : 0.15})`,").join("boxShadow: `0 0 0 3px ${color}60, 0 2px 6px rgba(0,0,0,0.25)`,");

// Tab active/inactive backgrounds
content = content.replace(/const activeBg = darkMode \? 'rgba\(255,255,255,0\.12\)' : '#ffffff';/g, '');
content = content.replace(/const activeColor = darkMode \? '#ffffff' : '#0f172a';/g, '');
content = content.replace(/const inactiveColor = darkMode \? 'rgba\(255,255,255,0\.35\)' : '#94a3b8';/g, '');

// Fix iconBtnBg
content = content.replace(
    /style=\{\{\s*background: t\.iconBtnBg,\s*color: t\.iconBtnClr\s*\}\}/g,
    'className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors border-none pm-icon-btn bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"'
);
content = content.replace(
    /className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors border-none pm-icon-btn"\s*/g,
    ''
);

// Fix tabBg container
content = content.replace(
    /style=\{\{\s*background: t\.tabBg\s*\}\}/g,
    'className="flex gap-1 p-1 rounded-xl mb-12 bg-black/5 dark:bg-white/5"'
);
content = content.replace(
    /className="flex gap-1 p-1 rounded-xl mb-12"\s*/g,
    ''
);

// Fix Play button styles
content = content.replace(
    /style=\{\{\s*background: t\.ctrlBg,\s*border: t\.ctrlBorder,\s*color: t\.ctrlColor\s*\}\}/g,
    'className="flex items-center justify-center w-12 h-12 rounded-full cursor-pointer border pm-ctrl-btn bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/45"'
);
content = content.replace(
    /className="flex items-center justify-center w-12 h-12 rounded-full cursor-pointer border pm-ctrl-btn"\s*/g,
    ''
);

// Fix cycleEmpty
content = content.replace(
    /style=\{\{\s*background: t\.cycleEmpty\s*\}\}/g,
    'className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10"'
);
content = content.replace(
    /className="w-1\.5 h-1\.5 rounded-full"\s*/g,
    ''
);

// Fix ProgressRing explicit SVG replacement
content = content.replace(
    /stroke=\{trackColor\}/g,
    'stroke="currentColor"'
);
content = content.replace(
    /<svg width=\{size\} height=\{size\} className="-rotate-90 absolute top-0 left-0" >/g,
    '<svg width={size} height={size} className={`-rotate-90 absolute top-0 left-0 ${trackColor}`} >'
);
content = content.replace(/trackColor=\{t\.ringTrack\}/g, 'trackColor="text-black/5 dark:text-white/10"');

// Clean up the `const t = ...` block entirely!
content = content.replace(/\s*\/\/ ── Theme tokens ──[\s\S]*?cancelColor: '#64748b',\s*glowBg:      \(c: string\) => \`radial-gradient\(circle, \$\{c\}10 0%, transparent 70%\)\`,\s*\};\s*/, '\n    // Removed t theme tokens\n');

// Also the Cancel / Save buttons
content = content.replace(
    /style=\{\{\s*background: t\.cancelBg,\s*border: t\.cancelBorder,\s*color: t\.cancelColor\s*\}\}/g,
    'className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors pm-cancel-btn border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50"'
);
content = content.replace(
    /className="flex-1 py-2\.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors pm-cancel-btn border"\s*/g,
    ''
);

// Make sure glowBg works without t.glowBg
content = content.split(`style={{
  background: t.glowBg(color)
}}`).join(`style={{ background: \`radial-gradient(circle, \${color}14 0%, transparent 70%)\` }}`);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed PomodoroModal dark mode classes');
