import re

path = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/PomodoroModal.tsx'

with open(path, 'r') as f:
    content = f.read()

# Fix duplicate className="text-slate-900 dark:text-white"
content = re.sub(
    r'className="([^"]+)" className="text-slate-900 dark:text-white"',
    r'className="\1 text-slate-900 dark:text-white"',
    content
)

# Fix duplicate className="text-slate-300 dark:text-white/20"
content = re.sub(
    r'className="([^"]+)" className="text-slate-300 dark:text-white/20"',
    r'className="\1 text-slate-300 dark:text-white/20"',
    content
)

# Fix duplicate className="text-slate-400 dark:text-white/35"
content = re.sub(
    r'className="([^"]+)" className="text-slate-400 dark:text-white/35"',
    r'className="\1 text-slate-400 dark:text-white/35"',
    content
)

# Fix ModeTab duplicate classes
content = re.sub(
    r'className="([^"]+)" className="flex gap-1 p-1 rounded-xl mb-12 bg-black/5 dark:bg-white/5"',
    r'className="\1 bg-black/5 dark:bg-white/5 mb-12"',
    content
)

# Fix leftover `t.` in styles
# Icon button
content = re.sub(
    r'style=\{\{\s*background: t\.iconBtnBg,\s*color: t\.iconBtnClr,\s*\}\}',
    r'className="pm-icon-btn w-8 h-8 rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all duration-150 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"',
    content
)

# Since I just added className directly to the style replacement, let's just wipe out the old className
content = re.sub(
    r'className="pm-icon-btn [^"]+"(\s+onClick=\{[^\}]+\})?\s*className="pm-icon-btn',
    r'\1\n                                className="pm-icon-btn',
    content
)

# A safer way to fix the t. vars is to manually replace the style={{ ... }} blocks where they still exist
content = re.sub(
    r'style=\{\{\s*background: t\.iconBtnBg,\s*color: t\.iconBtnClr,\s*\}\}',
    r'',
    content
)
content = re.sub(
    r'className="pm-icon-btn([^"]+)"\s*(onClick=\{[^\}]+\})?\s*(title="[^"]+")?',
    r'className="pm-icon-btn\1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/35"\n                                \2 \3',
    content
)
# Wait, let's just be explicit:

# For cancelBg
content = re.sub(
    r'style=\{\{\s*background: t\.cancelBg, border: t\.cancelBorder,\s*color: t\.cancelColor,\s*\}\}',
    r'',
    content
)
content = re.sub(
    r'className="pm-cancel-btn([^"]+)"',
    r'className="pm-cancel-btn\1 border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50"',
    content
)

# For ctrlBg
content = re.sub(
    r'style=\{\{\s*background: t\.ctrlBg, border: t\.ctrlBorder,\s*color: t\.ctrlColor,\s*\}\}',
    r'',
    content
)
content = re.sub(
    r'className="pm-ctrl-btn([^"]+)"',
    r'className="pm-ctrl-btn\1 border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/45"',
    content
)

# For cycleEmpty
content = re.sub(
    r't\.cycleEmpty',
    r"'rgba(0,0,0,0.1)'", # Fallback for cycleEmpty since we are doing ternary there
    content
)
# Actually, the dot container can just use inline style for now or I can fix it properly.
content = re.sub(
    r'background: i < completedInRound \? color : t\.cycleEmpty,',
    r"background: i < completedInRound ? color : (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),",
    content
)
# Wait, I removed the unused darkMode warnings? No, the previous build showed TS6133 'darkMode' is declared but never read. That means it was removed from use! So I should remove `darkMode` from the component or keep it for the dots.
# Wait, I passed darkMode to SettingsSlider and ModeTab, why did it say it's never read?
# Ah, I replaced the ModeTab and SettingsSlider darkMode usages!

with open(path, 'w') as f:
    f.write(content)

