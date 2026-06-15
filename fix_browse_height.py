import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# Make the outer container always fill the screen minus header
code = code.replace(
    """<div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>""",
    """<div className="browse-container" style={{ position: "relative", display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>"""
)

# Also add some left/right padding to the toolbar because we removed it from the parent
code = code.replace(
    """<div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', paddingLeft: 0 }}>""",
    """<div className="browse-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', padding: '16px 32px 0 32px' }}>"""
)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

