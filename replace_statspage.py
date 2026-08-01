import re

replacements = {
    "statspage-style-1": "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg shadow-lg",
    "statspage-style-2": "m-0 font-semibold text-slate-900 dark:text-slate-100",
    "statspage-style-3": "m-0",
    "statspage-style-4": "mt-[10vh]",
    "statspage-style-5": "pb-8",
    "statspage-style-6": "flex-1 min-h-0 w-full mt-4",
    "statspage-style-7": "pb-8",
    "statspage-style-8": "flex-1 min-h-0 w-full flex items-center mt-4",
    "statspage-style-9": "flex-1 min-w-0 h-full",
    "statspage-style-10": "drop-shadow-[0px_2px_4px_rgba(0,0,0,0.1)]",
    "statspage-style-11": "mt-2",
    "statspage-style-12": "flex-1 flex flex-col justify-center",
    "statspage-style-13": "text-slate-500 dark:text-slate-400",
    "statspage-style-14": "text-[1.2rem] text-slate-900 dark:text-slate-100",
    "statspage-style-15": "h-3 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden",
    "statspage-style-16": "bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-xl",
    "statspage-style-17": "flex justify-between mt-3 text-[0.85rem]",
    "statspage-style-18": "text-slate-500 dark:text-slate-400",
    "statspage-style-19": "text-slate-500 dark:text-slate-400",
}

with open("src/components/StatsPage.tsx", "r") as f:
    content = f.read()

for style_id, tailwind_classes in replacements.items():
    content = content.replace(f'className="{style_id}"', f'className="{tailwind_classes}"')
    content = content.replace(f'className="{style_id} ', f'className="{tailwind_classes} ')
    content = content.replace(f' {style_id}"', f' {tailwind_classes}"')
    content = content.replace(f' {style_id} ', f' {tailwind_classes} ')

# Remove the import line
content = content.replace("import './styles/StatsPage.css';\n", "")

with open("src/components/StatsPage.tsx", "w") as f:
    f.write(content)
