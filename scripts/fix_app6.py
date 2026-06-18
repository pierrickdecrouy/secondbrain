import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add import
if 'useNavigate' not in content[:1000]:
    content = content.replace("import { Route, Routes, useLocation", "import { Route, Routes, useLocation, useNavigate")

# 2. Fix setResumingTask
content = content.replace("setResumingTask(task);", "/* setResumingTask(task); */")

with open('src/App.tsx', 'w') as f:
    f.write(content)
