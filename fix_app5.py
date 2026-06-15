import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix the stray /*
content = content.replace("/* const openDueReviewSession = useCallback(() => {\n    setActiveSection('review');\n  }, []);", "")

with open('src/App.tsx', 'w') as f:
    f.write(content)
