import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Let's fix the dark mode colors first.
# Zinc 950 (#09090b) is not dark blue. But maybe body has a dark blue gradient?
# Let's see what is defined in html.dark
match = re.search(r'html\.dark \{.*?\n\}', css, re.DOTALL)
if match:
    print(match.group(0))

