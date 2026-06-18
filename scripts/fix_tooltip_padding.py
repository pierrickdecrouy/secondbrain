import re

with open('src/components/NetworkTooltip.tsx', 'r') as f:
    tsx = f.read()
tsx = tsx.replace('className="flex flex-col p-5"', 'className="flex flex-col" style={{ padding: "20px" }}')
with open('src/components/NetworkTooltip.tsx', 'w') as f:
    f.write(tsx)

