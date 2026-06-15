import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# Replace the flex: 1 parent of renderNetworkView to include display: flex
old_div = "<div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>"
new_div = "<div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative', display: 'flex', flexDirection: 'column' }}>"

code = code.replace(old_div, new_div)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

