import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if 'isCardDue' not in content[:1000]:
    content = content.replace("import { isExamModeActive", "import { isCardDue, isExamModeActive")

with open('src/App.tsx', 'w') as f:
    f.write(content)
