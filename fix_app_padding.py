import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# Update isNetworkContext or add isBrowseContext
old_style = """<div className="workspace-content-scroll" style={(isHomeSection || isNetworkContext) ? { padding: 0 } : {}}>"""
new_style = """<div className="workspace-content-scroll" style={(isHomeSection || isNetworkContext || location.pathname === '/browse') ? { padding: 0, overflow: 'hidden' } : {}}>"""

code = code.replace(old_style, new_style)

with open('src/App.tsx', 'w') as f:
    f.write(code)

