import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Make the active item nicer in dark mode
pattern = re.compile(r'html\.dark \.workspace-nav-item\.active \{.*?\}', re.DOTALL)
new_active = """html.dark .workspace-nav-item.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
}"""

css = re.sub(pattern, new_active, css)

with open('src/index.css', 'w') as f:
    f.write(css)
