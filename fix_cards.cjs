const fs = require('fs');
const file = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/CoursesPage.tsx';

let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /className=\{\`group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden cursor-pointer flex \$\{viewMode === 'list' \? 'flex-row items-center gap-6' : 'flex-col h-full'\} transition-all \$\{isActive \? 'border-2 border-emerald-500' : 'border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'\}\`\}/g,
    'className={`group bg-white dark:bg-slate-800 rounded-2xl shadow-md relative overflow-hidden cursor-pointer flex transition-all ${isActive ? "border-2 border-emerald-500" : "border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500"}`} style={{ padding: "1.5rem", flexDirection: viewMode === "list" ? "row" : "column", alignItems: viewMode === "list" ? "center" : "stretch", gap: viewMode === "list" ? "1.5rem" : "0", height: viewMode === "list" ? "auto" : "100%" }}'
);

fs.writeFileSync(file, content);
console.log("Fixed cards.");
