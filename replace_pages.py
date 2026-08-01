import re

login_replacements = {
    "loginpage-style-1": "fixed inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden",
    "loginpage-style-2": "absolute inset-0 z-0 pointer-events-none",
    "loginpage-style-3": "absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.32)_0%,transparent_70%)] blur-[70px] z-10 pointer-events-none",
    "loginpage-style-4": "absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.38)_0%,transparent_70%)] blur-[80px] z-10 pointer-events-none",
    "loginpage-style-5": "absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.3)_0%,transparent_70%)] blur-[60px] z-10 pointer-events-none",
    "loginpage-style-6": "relative z-20 flex flex-col items-center w-full max-w-[420px] px-5 gap-5",
    "loginpage-style-7": "h-[clamp(40px,7vw,60px)] brightness-0 invert opacity-90 block select-none pointer-events-none",
    "loginpage-style-8": "text-center",
    "loginpage-style-9": "text-[clamp(1.6rem,5.5vw,2.4rem)] font-extrabold tracking-[-0.03em] leading-tight m-0 bg-gradient-to-br from-white via-purple-300 to-emerald-300 bg-clip-text text-transparent",
    "loginpage-style-10": "text-white/40 text-[0.82rem] mt-2 font-normal leading-relaxed",
    "loginpage-style-11": "w-full bg-white/5 border border-white/10 rounded-[24px] backdrop-blur-[30px] px-8 py-7 shadow-[0_32px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]",
    "loginpage-style-12": "h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500 via-[30%] to-indigo-500 to-[70%] rounded-[1px] mb-[22px]",
    "loginpage-style-13": "flex flex-col gap-2.5",
    "loginpage-style-14": "overflow-hidden",
    "loginpage-style-15": "overflow-hidden",
    "loginpage-style-16": "text-right -mt-0.5",
    "loginpage-style-17": "bg-transparent border-none text-white/30 text-[0.72rem] cursor-pointer font-inherit p-0",
    "loginpage-style-18": "text-[0.75rem] m-0 px-3 py-1.5 rounded-lg",
    "loginpage-style-19": "w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl p-[13px] text-[0.9rem] font-bold font-inherit mt-0.5 shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-opacity duration-200",
    "loginpage-style-20": "flex items-center gap-3 my-4",
    "loginpage-style-21": "flex-1 h-px bg-white/10",
    "loginpage-style-22": "text-white/20 text-[0.68rem] tracking-[0.05em]",
    "loginpage-style-23": "flex-1 h-px bg-white/10",
    "loginpage-style-24": "w-full flex items-center justify-center gap-2.5 bg-white/5 text-white/70 border border-white/10 rounded-xl p-3 text-[0.85rem] font-semibold cursor-pointer font-inherit transition-colors duration-200",
    "loginpage-style-25": "mt-4 flex flex-col items-center gap-2",
    "loginpage-style-26": "text-white/30 text-[0.75rem] m-0",
    "loginpage-style-27": "bg-transparent border-none text-emerald-500 font-bold cursor-pointer text-[0.75rem] font-inherit",
    "loginpage-style-28": "text-white/30 text-[0.75rem] m-0",
    "loginpage-style-29": "bg-transparent border-none text-emerald-500 font-bold cursor-pointer text-[0.75rem] font-inherit",
    "loginpage-style-30": "bg-transparent border-none text-white/30 text-[0.75rem] cursor-pointer font-inherit",
    "loginpage-style-31": "bg-transparent border-none text-white/20 text-[0.68rem] cursor-pointer font-inherit tracking-[0.02em]",
    "loginpage-style-32": "flex flex-wrap justify-center gap-1.5",
    "loginpage-style-33": "text-white/20 text-[0.65rem] font-medium px-2.5 py-[3px] rounded-full border border-white/10",
}

settings_replacements = {
    "settingspage-style-1": "bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px]",
    "settingspage-style-2": "bg-white dark:bg-slate-900",
}

omnibox_replacements = {
    "omnibox-style-1": "absolute right-9 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400 p-1 flex items-center justify-center rounded-full",
}

homepage_replacements = {
    "className=\"homepage-container\"": "className=\"w-full h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px]\"",
    "className=\"homepage-main\"": "className=\"flex-1 flex flex-col max-w-[900px] mx-auto w-full p-8 justify-center\"",
    "className=\"homepage-welcome\"": "className=\"mb-6 pl-4\"",
    "className=\"homepage-welcome-name\"": "className=\"text-indigo-600 dark:text-indigo-500\"",
    "className=\"homepage-search-container\"": "className=\"w-full relative mb-8 cursor-text\"",
    "className=\"homepage-search-icon\"": "className=\"absolute top-0 bottom-0 left-5 flex items-center pointer-events-none\"",
    "className=\"homepage-search-placeholder\"": "className=\"absolute top-0 bottom-0 left-14 right-20 flex items-center pointer-events-none overflow-hidden\"",
    "className=\"homepage-search-placeholder-text\"": "className=\"text-slate-400 text-base whitespace-nowrap\"",
    "className=\"homepage-search-input\"": "className=\"w-full py-4 pr-20 pl-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-base text-slate-900 dark:text-slate-100 outline-none pointer-events-none\"",
    "className=\"homepage-search-kbd-container\"": "className=\"absolute right-4 top-0 bottom-0 flex items-center\"",
    "className=\"homepage-search-kbd\"": "className=\"flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800\"",
    "className=\"homepage-cards-grid\"": "className=\"grid grid-cols-1 md:grid-cols-3 gap-5 mb-8\"",
    "className=\"homepage-action-card\"": "className=\"bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer flex flex-col justify-between min-h-[160px]\"",
    "className=\"homepage-action-card-header\"": "className=\"flex items-center gap-3 mb-3\"",
    "className=\"homepage-action-card-icon sessions\"": "className=\"w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400\"",
    "className=\"homepage-action-card-icon courses\"": "className=\"w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400\"",
    "className=\"homepage-action-card-icon network\"": "className=\"w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400\"",
    "className=\"homepage-action-card-subtitle sessions\"": "className=\"text-[0.8125rem] font-semibold m-0 mt-0.5 text-indigo-600 dark:text-indigo-400\"",
    "className=\"homepage-action-card-subtitle courses\"": "className=\"text-[0.8125rem] font-semibold m-0 mt-0.5 text-amber-600 dark:text-amber-400\"",
    "className=\"homepage-action-card-subtitle network\"": "className=\"text-[0.8125rem] font-semibold m-0 mt-0.5 text-emerald-600 dark:text-emerald-400\"",
    "className=\"homepage-action-card-footer\"": "className=\"mt-4 flex justify-end\"",
    "className=\"homepage-action-card-button primary\"": "className=\"px-5 py-2 text-[0.8125rem] font-semibold rounded-[10px] border-none cursor-pointer bg-indigo-500 text-white\"",
    "className=\"homepage-action-card-button secondary\"": "className=\"px-5 py-2 text-[0.8125rem] font-semibold rounded-[10px] border cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800\"",
    "className=\"homepage-recent-section\"": "className=\"w-full\"",
    "className=\"homepage-recent-header\"": "className=\"flex items-center justify-between mb-4\"",
    "className=\"homepage-recent-grid\"": "className=\"grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4\"",
    "className=\"homepage-recent-card\"": "className=\"bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer\"",
    "className=\"homepage-recent-card-type-container\"": "className=\"flex items-center gap-2 mb-2\"",
    "className=\"homepage-recent-card-type-dot\"": "className=\"w-2 h-2 rounded-full\"",
    "className=\"homepage-recent-card-type-text\"": "className=\"text-[10px] font-bold uppercase tracking-[0.1em]\"",
    "className=\"homepage-new-card-slot\"": "className=\"bg-transparent p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 min-h-[120px]\"",
    "className=\"homepage-new-card-icon\"": "className=\"w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mb-2.5\"",
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
        
    # Extra fix for HomePage which uses elements directly in CSS
    if filepath.endswith("HomePage.tsx"):
        # replace specific HTML selectors from CSS
        content = content.replace("<h1>", "<h1 className=\"text-[2rem] font-extrabold text-slate-900 dark:text-slate-100 tracking-[-0.02em] mb-1\">")
        content = content.replace("<p>", "<p className=\"text-slate-500 dark:text-slate-400 text-base m-0\">")
        content = content.replace("<h2>", "<h2 className=\"text-[1.125rem] font-bold text-slate-900 dark:text-slate-100 m-0\">")
        content = content.replace("<h3>", "<h3 className=\"text-xs font-bold text-slate-400 uppercase tracking-[0.1em] m-0\">")
        content = content.replace("<button ", "<button className=\"text-[0.8125rem] font-semibold text-indigo-600 bg-transparent border-none cursor-pointer flex items-center gap-1\" ")
        content = content.replace("<h4>", "<h4 className=\"text-[0.9375rem] font-bold text-slate-900 dark:text-slate-100 m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis\">")
        content = content.replace("<p>", "<p className=\"text-[0.8125rem] text-slate-500 dark:text-slate-400 m-0 whitespace-nowrap overflow-hidden text-ellipsis\">")
        # specific manual fix for `<p className="homepage-action-card-subtitle ...">` because it was previously replaced in the dictionary but maybe not matching `<p>`.
        pass

    # Remove the import line
    content = content.replace(f"import './styles/{css_file}';\n", "")
    content = content.replace(f"import \"./styles/{css_file}\";\n", "")

    with open(filepath, "w") as f:
        f.write(content)

replace_in_file("src/components/LoginPage.tsx", login_replacements, "LoginPage.css")
replace_in_file("src/components/SettingsPage.tsx", settings_replacements, "SettingsPage.css")
replace_in_file("src/components/Omnibox.tsx", omnibox_replacements, "Omnibox.css")
replace_in_file("src/components/HomePage.tsx", homepage_replacements, "HomePage.css")
