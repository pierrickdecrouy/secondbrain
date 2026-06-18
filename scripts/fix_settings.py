import re

with open('src/components/SettingsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (onSave) onSave();", "")

with open('src/components/SettingsPage.tsx', 'w') as f:
    f.write(content)
