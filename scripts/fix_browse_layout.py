import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# Make the outer container always fill the screen
code = code.replace(
    """<div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', height: viewMode === 'split' ? 'calc(100vh - 120px)' : 'auto' }}>""",
    """<div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>"""
)

# Make the main content area take remaining height
code = code.replace(
    """<main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''}`} style={{ flex: viewMode === 'split' ? 1 : 'none', display: 'flex', flexDirection: 'column', minHeight: 0 }}>""",
    """<main className={`browse-content-area ${viewMode === 'network' ? 'browse-content-area--network' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>"""
)

# Fix the grid container styles so that it always has height: 100% and scrolls internally!
code = code.replace(
    """<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', flex: viewMode === 'split' ? 1 : 'none', height: viewMode === 'split' ? '100%' : 'auto', justifyContent: 'center', minHeight: 0 }}>""",
    """<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', flex: 1, height: '100%', justifyContent: 'center', minHeight: 0 }}>"""
)

# Always allow scrolling on the card list
code = code.replace(
    """<div style={{ flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1', overflowY: viewMode === 'split' ? 'auto' : 'visible', paddingRight: (viewMode === 'split' && selectedCard) ? '1rem' : 0, transition: 'all 0.3s ease-in-out', height: '100%' }}>""",
    """<div style={{ flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1', overflowY: 'auto', paddingRight: (viewMode === 'split' && selectedCard) ? '1rem' : 0, transition: 'all 0.3s ease-in-out', height: '100%', paddingBottom: '2rem' }}>"""
)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

