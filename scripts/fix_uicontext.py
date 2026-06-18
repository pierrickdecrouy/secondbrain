import re

with open('src/context/UIContext.tsx', 'r') as f:
    code = f.read()

code = code.replace("type ViewMode = 'grid' | 'list' | 'network';", "type ViewMode = 'grid' | 'list' | 'network' | 'split';")

with open('src/context/UIContext.tsx', 'w') as f:
    f.write(code)

