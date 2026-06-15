import re

with open('src/components/NetworkView.tsx', 'r') as f:
    content = f.read()

content = content.replace("ctx.setLineDash([4 / globalScale, 4 / globalScale]);", "ctx.setLineDash([8 / globalScale, 4 / globalScale]);")

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(content)

