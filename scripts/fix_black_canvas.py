import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# Let's wrap renderNetworkView in an absolute div to ensure it fills the flex container reliably!
old_render = "{renderNetworkView && renderNetworkView()}"
new_render = """<div style={{ position: 'absolute', inset: 0 }}>
                                {renderNetworkView && renderNetworkView()}
                            </div>"""

code = code.replace(old_render, new_render)

# Let's also fix the scroll issue in BrowsePage!
# We can make the container height 100% and hide overflow in split mode.
old_browse_container = """<div className="browse-container" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>"""
new_browse_container = """<div className="browse-container" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: viewMode === 'split' ? 'calc(100vh - 140px)' : 'auto' }}>"""

code = code.replace(old_browse_container, new_browse_container)

old_grid_parent = """<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', height: viewMode === 'split' ? 'calc(100vh - 180px)' : 'auto', justifyContent: 'center' }}>"""
new_grid_parent = """<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', flex: viewMode === 'split' ? 1 : 'none', height: viewMode === 'split' ? '100%' : 'auto', justifyContent: 'center', minHeight: 0 }}>"""

code = code.replace(old_grid_parent, new_grid_parent)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

