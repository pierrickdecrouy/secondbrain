import re

replacements = {
    "courseviewer-style-1": "flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden",
    "courseviewer-style-2": "flex flex-col h-full",
    "courseviewer-style-3": "flex items-center justify-between px-6 h-16 shrink-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 z-20",
    "courseviewer-style-4": "flex items-center gap-2 bg-transparent border-none cursor-pointer text-slate-500 font-medium text-sm px-3 py-2 rounded-md transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100",
    "courseviewer-style-5": "flex items-center gap-1.5",
    "courseviewer-style-6": "flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100",
    "courseviewer-style-7": "flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100",
    "courseviewer-style-8": "w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1",
    "courseviewer-style-9": "flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-slate-100 hover:dark:bg-slate-800 hover:text-slate-900 hover:dark:text-slate-100",
    "courseviewer-style-10": "flex items-center gap-1.5 bg-transparent border-none rounded-md px-3 py-2 text-[13px] font-medium text-slate-500 cursor-pointer transition-all duration-150 hover:bg-red-50 hover:dark:bg-red-900/20 hover:text-red-500",
    "courseviewer-style-11": "flex items-center gap-1.5 bg-teal-600 dark:bg-teal-500 border-none rounded-lg px-4.5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-opacity duration-150 ml-1 hover:opacity-90",
    "courseviewer-style-12": "w-full h-[180px] shrink-0 relative",
    "courseviewer-style-13": "absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent",
    "courseviewer-style-14": "w-full max-w-[760px] px-10 pb-20 relative z-10",
    "courseviewer-style-15": "mb-10",
    "courseviewer-style-16": "text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-100 mb-5",
    "courseviewer-style-17": "flex flex-wrap gap-2 mb-5",
    "courseviewer-style-18": "inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1",
    "courseviewer-style-19": "flex items-center gap-4",
    "courseviewer-style-20": "flex items-center gap-1.5 text-[13px] text-slate-500 font-medium",
    "courseviewer-style-21": "flex items-center gap-1.5 text-[13px] text-slate-500 font-medium",
    "courseviewer-style-22": "w-[3px] h-[3px] rounded-full bg-slate-500",
    "courseviewer-style-23": "text-base leading-relaxed text-slate-900 dark:text-slate-100",
    "courseviewer-style-24": "mt-12 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-10",
    "courseviewer-style-25": "text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3",
    "courseviewer-style-26": "flex flex-col gap-10",
    "courseviewer-style-27": "scroll-mt-[100px] group",
    "courseviewer-style-28": "text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-3 cursor-pointer outline-none select-none list-none [&::-webkit-details-marker]:hidden",
    "courseviewer-style-29": "w-3 h-3 rounded-full",
    "courseviewer-style-30": "flex-1",
    "courseviewer-style-31": "transition-transform duration-200 group-open:rotate-180",
    "courseviewer-style-32": "text-base leading-relaxed text-slate-900 dark:text-slate-100",
    "courseviewer-style-33": "p-6",
    "courseviewer-style-34": "font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1",
    "courseviewer-style-35": "text-[13px] text-slate-500",
    "courseviewer-style-36": "flex items-center justify-center gap-2 w-full p-3 rounded-xl mt-4 bg-emerald-500 border-none text-white font-bold text-sm cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)]",
    "courseviewer-style-37": "mb-8",
    "courseviewer-style-38": "flex justify-between items-center mb-4",
    "courseviewer-style-39": "text-base font-bold m-0 text-slate-900 dark:text-slate-100",
    "courseviewer-style-40": "bg-transparent border-none text-slate-500 cursor-pointer p-1",
    "courseviewer-style-41": "flex flex-col gap-2",
    "courseviewer-style-42": "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-150 hover:border-teal-500",
    "courseviewer-style-43": "w-2 h-2 rounded-full",
    "courseviewer-style-44": "flex-1 min-w-0 font-semibold text-[13px] text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap",
    "courseviewer-style-45": "bg-transparent border-none p-1 cursor-pointer text-slate-500 opacity-60 hover:opacity-100 hover:text-teal-500",
    "courseviewer-style-46": "flex justify-between items-center mb-4",
    "courseviewer-style-47": "text-base font-bold m-0 text-slate-900 dark:text-slate-100",
    "courseviewer-style-48": "flex gap-1",
    "courseviewer-style-49": "bg-transparent border-none text-slate-500 cursor-pointer p-1",
    "courseviewer-style-50": "bg-transparent border-none text-slate-500 cursor-pointer p-1",
    "courseviewer-style-51": "flex flex-col gap-2",
    "courseviewer-style-52": "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-150 hover:border-teal-500",
    "courseviewer-style-53": "flex-1 min-w-0",
    "courseviewer-style-54": "font-semibold text-[13px] text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap",
    "courseviewer-style-55": "text-[11px] font-semibold mt-1",
    "courseviewer-style-56": "p-8 px-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center",
    "courseviewer-style-57": "mb-4",
    "courseviewer-style-58": "text-[15px] font-semibold text-slate-900 dark:text-slate-100 m-0 mb-2",
    "courseviewer-style-59": "text-[13px] text-slate-500 m-0 mb-6 leading-relaxed",
    "courseviewer-style-60": "flex flex-col gap-2.5 w-full",
    "courseviewer-style-61": "p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-[13px] cursor-pointer border-none",
    "courseviewer-style-62": "flex gap-2",
    "courseviewer-style-63": "flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[13px] cursor-pointer",
    "courseviewer-style-64": "flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-[13px] cursor-pointer",
    "courseviewer-style-65": "font-sans leading-[1.4] text-[11pt]",
    "courseviewer-style-66": "text-[2rem] font-extrabold m-0 mb-1 font-sans text-black",
    "courseviewer-style-67": "text-[0.9rem] text-[#555] mb-4",
    "courseviewer-style-68": "mr-4",
    "courseviewer-style-69": "mb-5",
    "courseviewer-style-70": "text-[1.5rem] border-b border-black pb-1 m-0 mb-4",
    "courseviewer-style-71": "mb-4 break-inside-avoid",
    "courseviewer-style-72": "text-[1.2rem] text-black m-0 mb-2",
    "courseviewer-style-73": "mt-6 break-before-page",
    "courseviewer-style-74": "text-[1.5rem] border-b border-black pb-1 m-0 mb-4 font-sans",
    "courseviewer-style-75": "list-none p-0",
    "courseviewer-style-76": "mb-4 pb-2 border-b border-dashed border-[#ccc] break-inside-avoid",
    "courseviewer-style-77": "font-bold m-0 mb-1 text-[1.05rem]",
    "courseviewer-style-78": "m-0 mb-2 text-[1.05rem]",
    "courseviewer-style-79": "mt-6 break-before-page",
    "courseviewer-style-80": "text-[1.5rem] border-b border-black pb-1 m-0 mb-4 font-sans",
    "courseviewer-style-81": "list-none p-0",
    "courseviewer-style-82": "mb-4 pb-2 border-b border-[#eee] break-inside-avoid",
    "courseviewer-style-83": "font-bold m-0 mb-1 text-[#555]",
    "courseviewer-style-84": "text-[#333] text-[1.05rem]"
}

with open("src/components/CourseViewer.tsx", "r") as f:
    content = f.read()

for style_id, tailwind_classes in replacements.items():
    content = content.replace(f'className="{style_id}"', f'className="{tailwind_classes}"')
    content = content.replace(f'className="{style_id} ', f'className="{tailwind_classes} ')
    content = content.replace(f' {style_id}"', f' {tailwind_classes}"')
    content = content.replace(f' {style_id} ', f' {tailwind_classes} ')

# Also remove the inline hover event handlers that were used in conjunction with these classes since tailwind handles it
content = re.sub(r'onMouseEnter=\{e => \{[^}]+\}\}', '', content)
content = re.sub(r'onMouseLeave=\{e => \{[^}]+\}\}', '', content)
# Ensure there are no double spaces in className strings
# content = re.sub(r'className="([^"]+)"', lambda m: f'className="{re.sub(r" +", " ", m.group(1))}"', content)

# Remove the import line
content = content.replace("import './styles/CourseViewer.css';\n", "")

with open("src/components/CourseViewer.tsx", "w") as f:
    f.write(content)
