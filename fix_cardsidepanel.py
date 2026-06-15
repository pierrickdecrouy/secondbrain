import re

with open('src/components/CardSidePanel.tsx', 'r') as f:
    code = f.read()

# Remove isFullscreen
code = re.sub(r'    const \[isFullscreen, setIsFullscreen\] = useState\(false\);\n', '', code)

# Add calculateQualityScore
if 'import { calculateQualityScore }' not in code:
    code = code.replace(
        "import { searchCards } from '../searchIndex';",
        "import { searchCards } from '../searchIndex';\nimport { calculateQualityScore } from '../algorithms/qualityScoring';"
    )

# Fix the render:
# We'll replace the entire return block with something closer to DetailModal
target_render = r"    return \(\n        <aside className=\"card-side-panel\".*?</aside>\n    \);"
replacement_render = """    const quality = calculateQualityScore(card, allCards);

    return (
        <aside className="card-side-panel flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 50 }}>
            {/* Header */}
            <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Badge type={card.type} />
                        {/* Quality Indicator */}
                        <div
                            title={`Score de qualité : ${quality.score}/100`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: `${quality.color}20`,
                                border: `1px solid ${quality.color}40`,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: quality.color,
                            }}
                        >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: quality.color }} />
                            {quality.label} ({quality.score}%)
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{card.title}</h2>
                    {card.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{card.subtitle}</p>}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400">
                    {onPrev && (
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={onPrev} title="Précédent">
                            <CaretLeft size={18} weight="bold" />
                        </button>
                    )}
                    {onNext && (
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={onNext} title="Suivant">
                            <CaretRight size={18} weight="bold" />
                        </button>
                    )}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                    
                    {/* The "Expand" button is removed! No more full screen side panel! */}
                    
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={onPinToggle} title={pinned ? 'Dépingler' : 'Épingler'}>
                        {pinned ? <PushPinSlash size={18} /> : <PushPin size={18} />}
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={onClose} title="Fermer">
                        <X size={18} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {/* Summary block */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-indigo-400 dark:border-indigo-500">
                    <MarkdownRenderer 
                        content={card.content} 
                        className="text-sm text-slate-700 dark:text-slate-300"
                        onInternalLinkClick={(target) => {
                            const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                            if (found) {
                                onLinkClick(found.id);
                            }
                        }}
                    />
                </div>

                {/* Details */}
                <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Détails</h4>
                    <MarkdownRenderer 
                        content={card.details} 
                        className="text-sm text-slate-700 dark:text-slate-300"
                        onInternalLinkClick={(target) => {
                            const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                            if (found) {
                                onLinkClick(found.id);
                            }
                        }}
                    />
                </div>

                {/* Backlinks */}
                {backlinks.length > 0 && (
                    <section>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                            <Link size={16} />
                            Références ({backlinks.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {backlinks.map(link => (
                                <button
                                    key={link.id}
                                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors"
                                    onClick={() => onLinkClick(link.id)}
                                >
                                    {link.title}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </aside>
    );"""

code = re.sub(target_render, replacement_render, code, flags=re.DOTALL)

# Remove the keyboard effect's handling of isFullscreen
code = code.replace(
    "} else if (e.key === 'Escape' && isFullscreen) {\n                setIsFullscreen(false);\n                e.stopPropagation();\n            }",
    "}"
)
code = code.replace("}, [onPrev, onNext, isFullscreen]);", "}, [onPrev, onNext]);")

with open('src/components/CardSidePanel.tsx', 'w') as f:
    f.write(code)

