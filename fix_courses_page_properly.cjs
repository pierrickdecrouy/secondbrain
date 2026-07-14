const fs = require('fs');
const file = '/Users/pierrickdecrouy-chanel/Documents/Extnd. /secondbrain/src/components/CoursesPage.tsx';

let content = fs.readFileSync(file, 'utf8');

const replacement = `    return (
        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans pb-12 overflow-y-auto">
            <main className="max-w-6xl mx-auto px-6 pt-10">
                {/* En-tête de la page Cours */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes Fiches de Cours</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Gérez et révisez vos synthèses de cours structurées.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Vue Toggle */}
                        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={\`p-2 rounded-md transition-colors border-none cursor-pointer \${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent'}\`}
                            >
                                <SquaresFour size={20} weight="fill" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={\`p-2 rounded-md transition-colors border-none cursor-pointer \${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent'}\`}
                            >
                                <ListDashes size={20} weight="fill" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors border-none cursor-pointer"
                        >
                            <Plus size={20} weight="bold" />
                            Nouveau Cours
                        </button>
                    </div>
                </div>

                {/* Filtres et Recherche */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un cours..." 
                            className="w-full bg-white dark:bg-slate-800 rounded-xl pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm text-slate-900 dark:text-white" 
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
                        <button 
                            onClick={() => setSelectedTag(null)}
                            className={\`px-4 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap transition-colors border-none cursor-pointer \${selectedTag === null ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'}\`}
                        >
                            Tous ({courseCards.length})
                        </button>
                        {allTags.map(tag => (
                            <button 
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={\`px-4 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap transition-colors border-none cursor-pointer \${selectedTag === tag ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'}\`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grille de Cours */}
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {filteredCourses.map((course) => {
                        const prog = getCourseProgress(course.id);
                        const isActive = prog && prog.percentage > 0;
                        const elapsed = Math.round((Date.now() - (course.updatedAt || Date.now())) / (1000 * 60 * 60));
                        
                        return (
                            <div 
                                key={course.id}
                                onClick={() => handleView(course)}
                                className={\`group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden cursor-pointer flex \${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col h-full'} transition-all \${isActive ? 'border-2 border-emerald-500' : 'border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'}\`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                                
                                <div className={\`flex \${viewMode === 'list' ? 'items-center' : 'justify-between items-start'} mb-4\`}>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                                        <BookOpen size={24} weight="fill" />
                                    </div>
                                    {viewMode === 'grid' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                            className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                                        >
                                            <Trash size={20} />
                                        </button>
                                    )}
                                </div>
                                
                                <div className={\`\${viewMode === 'list' ? 'flex-1' : 'mb-4 flex-1'}\`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {course.subject && (
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                {course.subject}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {course.title || 'Sans titre'}
                                    </h3>
                                    {viewMode === 'grid' && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {stripMarkdown(course.details || course.content || '')}
                                        </p>
                                    )}
                                </div>
                                
                                <div className={\`\${viewMode === 'grid' ? 'pt-4 border-t border-slate-100 dark:border-slate-700' : ''} flex items-center justify-between mt-auto shrink-0\`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                                            <FileText size={14} weight="bold" />
                                            {prog ? prog.total : 0} Cartes
                                        </div>
                                        <span className="text-xs text-slate-400">Modifié il y a {elapsed}h</span>
                                        {viewMode === 'list' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteCourse(course); }}
                                                className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};
`;

const lines = content.split('\n');
const before = lines.slice(0, 304).join('\n');
fs.writeFileSync(file, before + '\n' + replacement);
console.log("Successfully replaced the main render function.");
