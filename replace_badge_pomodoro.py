import re

badge_replacements = {
    "badge-style-1": "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[11px] tracking-[0.025em] leading-none select-none",
}

pomodoro_replacements = {
    "pomodorotimer-style-1": "w-[7px] h-[7px] rounded-full shrink-0 transition-all duration-400 ease-in-out",
    "pomodorotimer-style-2": "flex items-center gap-[3px]",
    "pomodorotimer-style-3": "block rounded-full transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] h-1",
    "pomodorotimer-style-4": "flex items-center py-1 pr-1 pl-1.5 gap-0",
    "pomodorotimer-style-5": "ml-[1px]",
    "pomodorotimer-style-6": "w-1",
}

def replace_in_file(filepath, replacements, css_file):
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

replace_in_file("src/components/Badge.tsx", badge_replacements, "Badge.css")
replace_in_file("src/components/PomodoroTimer.tsx", pomodoro_replacements, "PomodoroTimer.css")

