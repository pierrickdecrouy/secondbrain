import re
with open('src/index.css', 'r') as f:
    css = f.read()

# get root variables
match = re.search(r':root \{.*?\n\}', css, re.DOTALL)
if match:
    print(match.group(0))
