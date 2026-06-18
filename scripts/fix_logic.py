import re

# 1. Fix CoursesPage.tsx (Nouveau cours button)
with open('src/components/CoursesPage.tsx', 'r') as f:
    courses = f.read()

courses = courses.replace(
    '''                                    cursor: 'pointer',\n                                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'\n                                }}\n                            >\n                                <Plus size={18} weight="bold" />\n                                Nouveau Cours\n                            </button>''',
    '''                                    cursor: 'pointer',\n                                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'\n                                }}\n                                onClick={() => setIsCreating(true)}\n                            >\n                                <Plus size={18} weight="bold" />\n                                Nouveau Cours\n                            </button>'''
)

with open('src/components/CoursesPage.tsx', 'w') as f:
    f.write(courses)


# 2. Fix App.tsx (hide CardSidePanel when in full screen)
with open('src/App.tsx', 'r') as f:
    app = f.read()

app = app.replace(
    '{selectedCard && (\n                          <div style={{',
    '{selectedCard && expandedCardId !== selectedCard.id && (\n                          <div style={{'
)

with open('src/App.tsx', 'w') as f:
    f.write(app)


# 3. Fix BrowsePage.tsx (hide side panels when full screen, AND fix split mode layout)
with open('src/components/BrowsePage.tsx', 'r') as f:
    bp = f.read()

# Replace selectedCard split mode
# Old: {selectedCard && viewMode === 'split' && ( ... <div style={{ position: 'absolute', top: 0, left: 0 ...
split_old = """            {selectedCard && viewMode === 'split' && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, width: '50%',
                    backgroundColor: 'var(--color-bg-base)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '8px 0 40px rgba(0, 0, 0, 0.25)',
                    borderRight: '1px solid rgba(148, 163, 184, 0.3)',
                    display: 'flex', flexDirection: 'column'
                }}>"""

split_new = """            {selectedCard && viewMode === 'split' && expandedCardId !== selectedCard.id && (
                <div style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0, width: '50%',
                    backgroundColor: 'var(--color-bg-base)',
                    zIndex: 100,
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.25)',
                    borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
                    display: 'flex', flexDirection: 'column'
                }}>"""
bp = bp.replace(split_old, split_new)

# And the other selectedCard block:
bp = bp.replace(
    '{selectedCard && viewMode !== \'split\' && (',
    '{selectedCard && viewMode !== \'split\' && expandedCardId !== selectedCard.id && ('
)


# Replace synthesisPanelCard
synth_old_regex = r'\{synthesisPanelCard && \(\s*<div style=\{\{\s*position: viewMode === \'split\' \? \'absolute\' : \'fixed\',.*?(?=<CardSidePanel)'
synth_new = """{synthesisPanelCard && expandedCardId !== synthesisPanelCard.id && (
                <div style={{
                    position: viewMode === 'split' ? 'absolute' : 'fixed',
                    top: 0, 
                    right: 0, 
                    bottom: 0, 
                    width: viewMode === 'split' ? '50%' : '500px',
                    maxWidth: '100vw',
                    backgroundColor: 'var(--color-bg-base)',
                    zIndex: 1000,
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.25)',
                    borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    """

bp = re.sub(synth_old_regex, synth_new, bp, flags=re.DOTALL)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(bp)

