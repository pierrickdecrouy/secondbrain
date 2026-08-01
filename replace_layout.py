import re

onboarding_replacements = {
    "onboardingwizard-style-1": "bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]",
    "onboardingwizard-style-2": "bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]",
}

applayout_replacements = {
    "applayout-style-1": "flex items-center ml-1 text-indigo-600 dark:text-indigo-400",
    "applayout-style-2": "h-12",
    "applayout-style-3": "relative",
    "applayout-style-4": "min-w-[18px] h-[18px] rounded-full bg-violet-500 text-white text-[0.6rem] font-extrabold flex items-center justify-center px-1 leading-none shadow-[0_1px_4px_rgba(139,92,246,0.4)]",
    "applayout-style-5": "mt-auto border-t border-slate-200 dark:border-slate-800 pt-3 mb-4 w-full flex flex-col gap-1",
    "applayout-style-6": "flex flex-col",
}

cardsidepanel_replacements = {
    "cardsidepanel-style-1": "shadow-[-10px_0_30px_rgba(0,0,0,0.03)]",
}

cardhistory_replacements = {
    "cardhistorymodal-style-1": "z-[1100]",
    "cardhistorymodal-style-2": "flex flex-col p-0 max-w-[600px] max-h-[80vh]",
    "cardhistorymodal-style-3": "px-8 py-6 border-b border-slate-200 dark:border-slate-800",
    "cardhistorymodal-style-4": "flex items-center gap-3",
    "cardhistorymodal-style-5": "w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center",
    "cardhistorymodal-style-6": "text-[1.2rem] font-semibold m-0 text-slate-900 dark:text-slate-100",
    "cardhistorymodal-style-7": "mt-1 mb-0 text-[0.9rem] text-slate-500 dark:text-slate-400",
    "cardhistorymodal-style-8": "bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400",
    "cardhistorymodal-style-9": "px-8 py-6 overflow-y-auto flex-1",
    "cardhistorymodal-style-10": "text-slate-500 dark:text-slate-400 text-center my-10",
    "cardhistorymodal-style-11": "flex flex-col gap-6",
    "cardhistorymodal-style-12": "flex gap-4",
    "cardhistorymodal-style-13": "flex flex-col items-center",
    "cardhistorymodal-style-14": "w-3 h-3 rounded-full mt-1.5",
    "cardhistorymodal-style-15": "w-[2px] flex-1 bg-slate-200 dark:bg-slate-800 my-1",
    "cardhistorymodal-style-16": "flex-1",
    "cardhistorymodal-style-17": "flex justify-between items-start mb-2",
    "cardhistorymodal-style-18": "font-semibold text-[0.95rem] text-slate-900 dark:text-slate-100",
    "cardhistorymodal-style-19": "text-sm text-slate-500 dark:text-slate-400",
    "cardhistorymodal-style-20": "text-sm text-slate-500 dark:text-slate-400 mb-2",
    "cardhistorymodal-style-21": "mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800",
    "cardhistorymodal-style-22": "text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2",
    "cardhistorymodal-style-23": "flex flex-col gap-2",
    "cardhistorymodal-style-24": "text-[0.85rem] text-rose-500 bg-rose-500/5 px-2.5 py-1.5 rounded line-through",
    "cardhistorymodal-style-25": "text-[0.85rem] text-emerald-500 bg-emerald-500/5 px-2.5 py-1.5 rounded",
}


def replace_in_file(filepath, replacements, css_file):
    import os
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    for style_id, tailwind_classes in replacements.items():
        if style_id.startswith('className='):
            content = content.replace(style_id, tailwind_classes)
            continue
        content = content.replace(f'className="{style_id}"', f'className="{tailwind_classes}"')
        content = content.replace(f'className="{style_id} ', f'className="{tailwind_classes} ')
        content = content.replace(f' {style_id}"', f' {tailwind_classes}"')
        content = content.replace(f' {style_id} ', f' {tailwind_classes} ')

    # Remove the import line
    content = content.replace(f"import './styles/{css_file}';\n", "")
    content = content.replace(f"import \"./styles/{css_file}\";\n", "")

    with open(filepath, "w") as f:
        f.write(content)

replace_in_file("src/components/OnboardingWizard.tsx", onboarding_replacements, "OnboardingWizard.css")
replace_in_file("src/components/AppLayout.tsx", applayout_replacements, "AppLayout.css")
replace_in_file("src/components/CardSidePanel.tsx", cardsidepanel_replacements, "CardSidePanel.css")
replace_in_file("src/components/CardHistoryModal.tsx", cardhistory_replacements, "CardHistoryModal.css")
