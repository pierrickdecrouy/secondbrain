const fs = require('fs');
const file = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/CoursesPage.tsx';

let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    '<div className={viewMode === \\'grid\\' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>',
    '<div style={{ display: viewMode === \\'grid\\' ? "grid" : "flex", flexDirection: viewMode === \\'grid\\' ? undefined : "column", gap: viewMode === \\'grid\\' ? "1.5rem" : "1rem", gridTemplateColumns: viewMode === \\'grid\\' ? "repeat(auto-fill, minmax(320px, 1fr))" : undefined }}>'
);

fs.writeFileSync(file, content);
console.log("Fixed grid");
