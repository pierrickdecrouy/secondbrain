import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Fix the margin-top logic
css = css.replace("margin-top: -80px; /* Offset the absolute header */", "/* margin-top removed since absolute header removes it from flow */")

with open('src/index.css', 'w') as f:
    f.write(css)

