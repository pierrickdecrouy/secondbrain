const fs = require('fs');
const file = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/CoursesPage.tsx';

let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    '<div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans pb-12 overflow-y-auto">',
    '<div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans pb-12 overflow-y-auto" style={{ display: "flex", justifyContent: "center", padding: "2rem", width: "100%" }}>'
);

content = content.replace(
    '<main className="max-w-6xl mx-auto px-6 pt-10">',
    '<main className="max-w-6xl mx-auto px-6 pt-10" style={{ maxWidth: "1152px", width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>'
);

fs.writeFileSync(file, content);
console.log("Successfully fixed layout.");
