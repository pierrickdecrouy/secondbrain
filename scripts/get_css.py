import re

with open('src/index.css', 'r') as f:
    content = f.read()

match = re.search(r'\.search-wrapper \{.*?\.search-input:focus \{.*?\}', content, re.DOTALL)
if match:
    print(match.group(0))

