import re

with open('/Users/pierrickdecrouy-chanel/.gemini/antigravity/brain/deb0d0b2-da77-48fd-9187-87c5ab311b4e/task.md', 'r') as f:
    content = f.read()

# Mark 1.3 as done
content = content.replace("- `[/]` 1.3. Refactoriser `App.tsx` pour utiliser le routeur et les contextes.", "- `[x]` 1.3. Refactoriser `App.tsx` pour utiliser le routeur et les contextes.")

# Add new tasks and mark as done
content = content.replace("- `[x]` 3.3. Backlinking: Auto-création des liens via `[[Nom]]`.", "- `[x]` 3.3. Backlinking: Auto-création des liens via `[[Nom]]`.\n  - `[x]` 3.4. Amélioration de l'UI des liens (NetworkView Tooltip).")

with open('/Users/pierrickdecrouy-chanel/.gemini/antigravity/brain/deb0d0b2-da77-48fd-9187-87c5ab311b4e/task.md', 'w') as f:
    f.write(content)
