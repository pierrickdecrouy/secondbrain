import re

with open('src/components/NetworkView.tsx', 'r') as f:
    code = f.read()

# Remove the dimensions.height > 0 check, as height might initially be 0 due to CSS flexbox quirks
code = code.replace(
    "{dimensions.width > 0 && dimensions.height > 0 ? (",
    "{dimensions.width > 0 ? ("
)

with open('src/components/NetworkView.tsx', 'w') as f:
    f.write(code)

