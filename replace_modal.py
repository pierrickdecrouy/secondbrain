import re

upsell_replacements = {
    "upsellmodal-style-1": "bg-gradient-to-br from-indigo-950 to-indigo-900",
    "upsellmodal-style-2": "bg-gradient-to-r from-transparent via-emerald-500 via-[30%] to-indigo-500 to-[70%]",
    "upsellmodal-style-3": "bg-gradient-to-br from-emerald-500 to-emerald-600",
}

errorboundary_replacements = {
    "errorboundary-style-1": "flex flex-col items-center justify-center h-full w-full p-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl",
    "errorboundary-style-2": "bg-red-500/10 text-red-500 p-4 rounded-full mb-6",
    "errorboundary-style-3": "mb-4 text-2xl font-bold",
    "errorboundary-style-4": "text-slate-500 dark:text-slate-400 mb-8 max-w-[400px]",
    "errorboundary-style-5": "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg text-sm text-red-500 max-w-[600px] overflow-auto text-left mb-8 font-mono",
    "errorboundary-style-6": "flex gap-4",
    "errorboundary-style-7": "flex items-center gap-2",
    "errorboundary-style-8": "flex items-center gap-2",
}

detail_replacements = {
    "detailmodal-style-1": "pt-10 px-12 pb-4",
    "detailmodal-style-2": "px-2 py-1.5",
    "detailmodal-style-3": "px-12 pb-6",
    "detailmodal-style-4": "px-12 pb-10",
    "detailmodal-style-5": "pt-8 px-12 pb-10",
}

pomodoro_replacements = {
    "pomodoromodal-style-1": "-rotate-90 absolute top-0 left-0",
    "pomodoromodal-style-2": "transition-[stroke-dashoffset,stroke] duration-[1s,600ms] ease-[linear,ease]",
    "pomodoromodal-style-3": "tracking-[0.04em]",
    "pomodoromodal-style-4": "backdrop-blur-[24px]",
    "pomodoromodal-style-5": "absolute top-[20%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full pointer-events-none transition-colors duration-600 ease-in-out",
    "pomodoromodal-style-6": "flex-1 p-3 rounded-[14px] border-none text-white text-sm font-bold cursor-pointer transition-all duration-150",
}

def replace_in_file(filepath, replacements, css_file):
    import os
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    for style_id, tailwind_classes in replacements.items():
        content = content.replace(f'className="{style_id}"', f'className="{tailwind_classes}"')
        content = content.replace(f'className="{style_id} ', f'className="{tailwind_classes} ')
        content = content.replace(f' {style_id}"', f' {tailwind_classes}"')
        content = content.replace(f' {style_id} ', f' {tailwind_classes} ')

    # Remove the import line
    content = content.replace(f"import './styles/{css_file}';\n", "")
    content = content.replace(f"import \"./styles/{css_file}\";\n", "")

    with open(filepath, "w") as f:
        f.write(content)

replace_in_file("src/components/UpsellModal.tsx", upsell_replacements, "UpsellModal.css")
replace_in_file("src/components/ErrorBoundary.tsx", errorboundary_replacements, "ErrorBoundary.css")
replace_in_file("src/components/DetailModal.tsx", detail_replacements, "DetailModal.css")
replace_in_file("src/components/PomodoroModal.tsx", pomodoro_replacements, "PomodoroModal.css")
