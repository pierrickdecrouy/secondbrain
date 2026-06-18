import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Fix totalDue logic
content = re.sub(
    r'totalDue=\{cards\.filter.*?\}',
    r'totalDue={cards.filter(c => c.progress?.dueDate && new Date(c.progress.dueDate) <= new Date() && c.type !== COURSE_TYPE).length}',
    content
)

# 2. Fix handleFilterToggle unused
content = content.replace("const handleFilterToggle = (type: string) => {", "const handleFilterToggle = (type: string) => {\n// @ts-ignore\n")
# actually let's just comment it out
content = re.sub(r'(const handleFilterToggle =.*?setActiveFilters.*?\n  \};\n)', r'/* \1 */', content, flags=re.DOTALL)

# 3. Fix openDueReviewSession unused
content = re.sub(r'(const openDueReviewSession =.*?setReviewSession.*?\n  \};\n)', r'/* \1 */', content, flags=re.DOTALL)

# 4. Fix resumingTask unused
content = content.replace("const [resumingTask, setResumingTask] = useState<PausedTask | null>(null);", "/* const [resumingTask, setResumingTask] = useState<PausedTask | null>(null); */")

with open('src/App.tsx', 'w') as f:
    f.write(content)
