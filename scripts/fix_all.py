import re

# 1. Fix index.css to add proper .modal-summary styles for both light and dark mode
with open('src/index.css', 'r') as f:
    css = f.read()

if '.modal-summary {' not in css:
    summary_css = """
.modal-summary {
  margin-top: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border-radius: 8px;
  border-left: 4px solid var(--color-drug);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

html.dark .modal-summary {
  background: rgba(255, 255, 255, 0.05);
  border-left-color: var(--color-drug);
}
"""
    css = css + summary_css
    with open('src/index.css', 'w') as f:
        f.write(css)

# 2. Fix DetailModal.tsx to use the class instead of inline styles
with open('src/components/DetailModal.tsx', 'r') as f:
    dm = f.read()

dm = re.sub(
    r'<div className="modal-summary" style={{[^}]+}}>',
    '<div className="modal-summary">',
    dm
)
with open('src/components/DetailModal.tsx', 'w') as f:
    f.write(dm)

# 3. Fix CardSidePanel.tsx to use standard modal classes instead of failing Tailwind classes
with open('src/components/CardSidePanel.tsx', 'r') as f:
    csp = f.read()

# Replace the header and body with modal-header and modal-body
replacement_render = """    const quality = calculateQualityScore(card, allCards);

    return (
        <aside className="card-side-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-body)', padding: 0 }}>
            {/* Header */}
            <header className="modal-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                    <h2 className="modal-title" style={{ margin: 0 }}>{card.title}</h2>
                    {card.subtitle && <p className="modal-subtitle" style={{ marginTop: '4px' }}>{card.subtitle}</p>}
                </div>
                
                {/* Actions */}
                <div className="modal-header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {onPrev && (
                        <button className="browse-action-btn" onClick={onPrev} title="Précédent">
                            <CaretLeft size={18} weight="bold" />
                        </button>
                    )}
                    {onNext && (
                        <button className="browse-action-btn" onClick={onNext} title="Suivant">
                            <CaretRight size={18} weight="bold" />
                        </button>
                    )}
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 8px' }} />
                    
                    <button className="browse-action-btn" onClick={onPinToggle} title={pinned ? 'Dépingler' : 'Épingler'}>
                        {pinned ? <PushPinSlash size={18} /> : <PushPin size={18} />}
                    </button>
                    <button className="browse-action-btn" onClick={onClose} title="Fermer">
                        <X size={18} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="modal-body markdown-content custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {/* Summary block */}
                <div className="modal-summary">
                    <MarkdownRenderer 
                        content={card.content} 
                        onInternalLinkClick={(target) => {
                            const found = allCards.find(c => c.title.toLowerCase() === target.toLowerCase());
                            if (found) {
                                onLinkClick(found.id);
                            }
                        }}
                    />
                </div>

                {/* Details */}
                <div style={{ marginTop: '24px' }}>
                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '12px', letterSpacing: '0.05em' }}>Détails</h4>
                    <MarkdownRenderer 
                        content={card.details} 
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
                    <section style={{ marginTop: '32px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-grey)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            <Link size={16} />
                            Références ({backlinks.length})
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {backlinks.map(link => (
                                <button
                                    key={link.id}
                                    className="link-chip"
                                    data-type={link.type}
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

csp = re.sub(r'    const quality = calculateQualityScore\(card, allCards\);\n\n    return \(\n        <aside className="card-side-panel.*?</aside>\n    \);', replacement_render, csp, flags=re.DOTALL)

with open('src/components/CardSidePanel.tsx', 'w') as f:
    f.write(csp)

