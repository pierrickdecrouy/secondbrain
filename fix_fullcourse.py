import re

with open('src/components/FullCourseEditor.tsx', 'r') as f:
    code = f.read()

# Replace if (!editor) return null; with a loading state to see if it's stuck
code = code.replace(
    "if (!editor) return null;",
    "if (!editor) return <div style={{padding: '50px', color: 'red'}}>Chargement de l'éditeur... (si ce message reste, c'est que l'éditeur a planté)</div>;"
)

with open('src/components/FullCourseEditor.tsx', 'w') as f:
    f.write(code)

