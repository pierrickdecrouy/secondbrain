import re

replacements = {
    "licensebanner-style-1": "flex items-center justify-between px-4 py-2 shrink-0",
    "licensebanner-style-2": "flex items-center gap-2",
    "licensebanner-style-3": "flex items-center",
    "licensebanner-style-4": "text-[13px] font-medium text-slate-900 dark:text-slate-100",
    "licensebanner-style-5": "flex items-center gap-2",
    "licensebanner-style-6": "flex items-center gap-[5px] px-3.5 py-[5px] rounded-lg border-none text-white font-semibold text-xs cursor-pointer",
    "licensebanner-style-7": "bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400 flex p-1",
}

with open("src/components/LicenseBanner.tsx", "r") as f:
    content = f.read()

for style_id, tailwind_classes in replacements.items():
    content = content.replace(f'className="{style_id}"', f'className="{tailwind_classes}"')
    content = content.replace(f'className="{style_id} ', f'className="{tailwind_classes} ')
    content = content.replace(f' {style_id}"', f' {tailwind_classes}"')
    content = content.replace(f' {style_id} ', f' {tailwind_classes} ')

# Remove the import line
content = content.replace("import './styles/LicenseBanner.css';\n", "")

with open("src/components/LicenseBanner.tsx", "w") as f:
    f.write(content)
