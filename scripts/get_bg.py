import re
with open('src/index.css', 'r') as f:
    css = f.read()

match = re.search(r'\.home-animated-bg \{.*?(?=\n\n|\n[a-z\.])', css, re.DOTALL)
if match:
    print(match.group(0))
