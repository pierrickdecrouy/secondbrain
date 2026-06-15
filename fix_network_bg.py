import re

with open('src/components/NetworkView.tsx', 'r') as f:
    content = f.read()

# Replace graphBg logic
content = re.sub(r"const graphBg = isDark \? '#0f172a' : '#f8fafc';", "const graphBg = isDark ? '#0a0f18' : '#f8fafc';", content)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(content)

