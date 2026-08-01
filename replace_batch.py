import re

courses_replacements = {
    "coursespage-style-1": "mt-5",
}

browse_replacements = {
    "browse-content-area-styled": "flex-1 flex flex-col min-h-0 overflow-hidden",
}

batch_replacements = {
    "batch-format-selector": "flex items-center p-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]",
    "batch-format-btn active": "flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 border-none outline-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]",
    "batch-format-btn": "flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 border-none outline-none cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
    "batch-dropzone drag-over": "flex-1 relative rounded-2xl border-2 border-solid border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 transition-all duration-200 overflow-hidden shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]",
    "batch-dropzone": "flex-1 relative rounded-2xl border-2 border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 overflow-hidden shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]",
    "batch-preview-item": "p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 relative shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-700",
}

cardform_replacements = {
    "card-form-status-badge": "text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]",
    "card-form-action-btn danger": "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer border border-transparent outline-none bg-red-500/10 text-red-500 hover:bg-red-500/20",
    "card-form-action-btn": "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer border border-transparent outline-none bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
    "card-form-panel": "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6",
    "card-form-save-btn": "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 border-none outline-none cursor-pointer shrink-0 whitespace-nowrap",
    "tag-pill": "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-900 dark:text-slate-100",
    "tag-pill-close": "cursor-pointer text-slate-500 dark:text-slate-400 transition-colors duration-200 hover:text-slate-900 dark:hover:text-slate-100",
    "tag-input-container": "flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-slate-300 dark:border-slate-700 text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-colors duration-200 cursor-text w-48 bg-transparent hover:border-solid hover:bg-white dark:hover:bg-slate-900 focus-within:border-solid focus-within:bg-white dark:focus-within:bg-slate-900",
    "tag-input-field": "bg-transparent border-none outline-none text-[11px] w-full text-slate-900 dark:text-slate-100 p-0 placeholder:text-slate-500 dark:placeholder:text-slate-400 placeholder:opacity-70",
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

replace_in_file("src/components/CoursesPage.tsx", courses_replacements, "CoursesPage.css")
replace_in_file("src/components/BrowsePage.tsx", browse_replacements, "BrowsePage.css")
replace_in_file("src/components/BatchImportModal.tsx", batch_replacements, "BatchImport.css")
replace_in_file("src/components/CardForm.tsx", cardform_replacements, "CardForm.css")
