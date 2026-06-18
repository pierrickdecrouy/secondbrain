import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove the broken comment around handleFilterToggle
content = re.sub(r'/\* const handleFilterToggle =.*?\}\n \*/ \*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* const handleFilterToggle =.*?\*/ \*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* const handleFilterToggle =.*?  \};\n \*/', '', content, flags=re.DOTALL)
content = re.sub(r'/\* const openDueReviewSession =.*?  \};\n \*/', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
