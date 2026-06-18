import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Make the sidebar background use the darker background color
pattern = re.compile(r'html\.dark \.workspace-sidebar \{\n  background: var\(--color-surface\);')
css = re.sub(pattern, 'html.dark .workspace-sidebar {\n  background: var(--pharma-bg-sidebar);', css)

with open('src/index.css', 'w') as f:
    f.write(css)

