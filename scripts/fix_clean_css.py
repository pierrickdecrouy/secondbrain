import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Remove the old html.dark .home-animated-bg block
css = re.sub(r'html\.dark \.home-animated-bg \{\n  opacity: 0\.4;\n\}\n', '', css)

with open('src/index.css', 'w') as f:
    f.write(css)

