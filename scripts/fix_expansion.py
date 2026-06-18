import re

# 1. Update CardSidePanel.tsx to add onExpand prop and the button
with open('src/components/CardSidePanel.tsx', 'r') as f:
    csp = f.read()

if 'onExpand?: () => void;' not in csp:
    csp = csp.replace(
        'onNext?: () => void;',
        'onNext?: () => void;\n    onExpand?: () => void;'
    )
    csp = csp.replace(
        'onNext\n})',
        'onNext,\n    onExpand\n})'
    )
    # Add Expand button right before Pin button
    expand_btn = """                    {onExpand && (
                        <button className="browse-action-btn" onClick={onExpand} title="Plein écran">
                            <CornersOut size={18} />
                        </button>
                    )}
                    <button className="browse-action-btn" onClick={onPinToggle}"""
    csp = csp.replace('<button className="browse-action-btn" onClick={onPinToggle}', expand_btn)
    with open('src/components/CardSidePanel.tsx', 'w') as f:
        f.write(csp)

# 2. Update App.tsx
with open('src/App.tsx', 'r') as f:
    app = f.read()

if 'const [expandedCardId, setExpandedCardId] = useState<string | null>(null);' not in app:
    app = app.replace(
        'const [selectedCardId, setSelectedCardId] = useState<string | null>(null);',
        'const [selectedCardId, setSelectedCardId] = useState<string | null>(null);\n  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);'
    )

app = app.replace(
    'boxShadow: \'-4px 0 20px rgba(0, 0, 0, 0.05)\',',
    'boxShadow: \'-8px 0 40px rgba(0, 0, 0, 0.25)\','
)
app = app.replace(
    'borderLeft: \'1px solid var(--border-light)\',',
    'borderLeft: \'1px solid rgba(148, 163, 184, 0.3)\','
)

app = app.replace(
    'onNext={handleNextCard}',
    'onNext={handleNextCard}\n                                  onExpand={() => setExpandedCardId(selectedCard.id)}'
)

# Fix DetailModal condition in App.tsx
app = re.sub(
    r'\{selectedCard && !isNetworkContext && \(',
    '{selectedCard && (!isNetworkContext || expandedCardId === selectedCard.id) && (',
    app
)

# On DetailModal close in App.tsx, clear expandedCardId as well
app = re.sub(
    r'<DetailModal\s+card=\{selectedCard\}\s+allCards=\{cards\}\s+onClose=\{\(\) => setSelectedCardId\(null\)\}',
    '<DetailModal\n          card={selectedCard}\n          allCards={cards}\n          onClose={() => { setSelectedCardId(null); setExpandedCardId(null); }}',
    app
)

with open('src/App.tsx', 'w') as f:
    f.write(app)

# 3. Update BrowsePage.tsx
with open('src/components/BrowsePage.tsx', 'r') as f:
    bp = f.read()

if 'const [expandedCardId, setExpandedCardId] = useState<string | null>(null);' not in bp:
    bp = bp.replace(
        'const [selectedCardId, setSelectedCardId] = useState<string | null>(null);',
        'const [selectedCardId, setSelectedCardId] = useState<string | null>(null);\n    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);'
    )

# Fix wrapper styles in BrowsePage
bp = bp.replace(
    'borderRight: \'1px solid var(--border-light)\',',
    'borderRight: \'1px solid rgba(148, 163, 184, 0.3)\',',
)
bp = bp.replace(
    'borderLeft: viewMode === \'split\' ? \'none\' : \'1px solid var(--border-light)\',',
    'borderLeft: viewMode === \'split\' ? \'none\' : \'1px solid rgba(148, 163, 184, 0.3)\','
)
bp = bp.replace(
    'borderRight: viewMode === \'split\' ? \'1px solid var(--border-light)\' : \'none\',',
    'borderRight: viewMode === \'split\' ? \'1px solid rgba(148, 163, 184, 0.3)\' : \'none\','
)
# Add shadow to wrappers in BrowsePage if they don't have it (they didn't)
bp = re.sub(
    r'animation: \'slideInLeft 0.3s cubic-bezier\(0.16, 1, 0.3, 1\)\',',
    'animation: \'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)\',\n                    boxShadow: \'8px 0 40px rgba(0, 0, 0, 0.25)\',',
    bp
)
bp = re.sub(
    r'animation: viewMode === \'split\' \? \'slideInLeft 0.3s cubic-bezier\(0.16, 1, 0.3, 1\)\' : \'slideInRight 0.3s cubic-bezier\(0.16, 1, 0.3, 1\)\',',
    'animation: viewMode === \'split\' ? \'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)\' : \'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)\',\n                    boxShadow: viewMode === \'split\' ? \'8px 0 40px rgba(0, 0, 0, 0.25)\' : \'-8px 0 40px rgba(0, 0, 0, 0.25)\',',
    bp
)

# Add onExpand to BrowsePage's CardSidePanels
bp = bp.replace(
    'pinned={false}\n                        onLinkClick=',
    'pinned={false}\n                        onExpand={() => setExpandedCardId(selectedCard.id)}\n                        onLinkClick='
)
bp = bp.replace(
    'pinned={false}\n                        onLinkClick={(id) => {',
    'pinned={false}\n                        onExpand={() => setExpandedCardId(synthesisPanelCard.id)}\n                        onLinkClick={(id) => {'
)

# Fix DetailModal condition in BrowsePage
bp = re.sub(
    r'\{selectedCard && viewMode !== \'split\' && \(',
    '{selectedCard && (viewMode !== \'split\' || expandedCardId === selectedCard.id) && (',
    bp
)
# Close expanded modal
bp = re.sub(
    r'<DetailModal\s+card=\{selectedCard\}\s+allCards=\{cards\}\s+onClose=\{\(\) => setSelectedCardId\(null\)\}',
    '<DetailModal\n                    card={selectedCard}\n                    allCards={cards}\n                    onClose={() => { setSelectedCardId(null); setExpandedCardId(null); }}',
    bp
)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(bp)

