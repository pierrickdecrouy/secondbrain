import re
with open('src/index.css', 'r') as f:
    css = f.read()

match = re.search(r'html\.dark \{.*?\n\}', css, re.DOTALL)
if match:
    print(match.group(0))
