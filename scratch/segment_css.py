import re
import os

with open("src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

# Regular expression to find section headers
header_pattern = re.compile(r'/\* =+\s*\n\s*(.+?)\s*\n\s*=+\s*\*/', re.MULTILINE)

# Find all matches
matches = list(header_pattern.finditer(content))

if not matches:
    print("No sections found.")
    exit(0)

# We have stuff before the first match (Tailwind config, root, base styles)
base_css = content[:matches[0].start()]

sections = {}
for i in range(len(matches)):
    start = matches[i].end()
    end = matches[i+1].start() if i + 1 < len(matches) else len(content)
    section_name = matches[i].group(1).strip()
    section_content = content[start:end].strip()
    if section_content:
        sections[section_name] = section_content

# Map sections to files
file_mapping = {
    'base.css': ['PharmaBrain - Clean & Minimal CSS', 'Dark Mode'],
    'layout.css': ['Layout', 'Scrollbar', 'List View Styles'],
    'components.css': ['Global Header', 'Card Grid', 'Card Item', 'Modal', 'Focus Mode (Review Session)', 'Modal Image', 'Markdown Content Styling', 'Links & Backlinks Sections', 'View Toggle', 'Buttons', 'Confirm Delete Modal', 'Import Tabs', 'Header Logo Group', 'Modal Navigation', 'Card Grid Improvements', 'Buttons Standardization'],
    'pages.css': ['Network View', 'Home Page', 'Home Page - Browser New Tab Style', 'Home Page Animation', 'Homepage polish overrides', 'Navigation coherence overrides', 'Stats page integration', 'Print / PDF Export', 'CoursesPage — Layout propre', 'AddDataPage — Refonte']
}

os.makedirs("src/styles", exist_ok=True)

# Write base.css (including the prelude which has the tailwind imports, or keep them in index.css?)
# The user wants index.css to just have imports.
prelude_match = re.search(r'(@import "tailwindcss".*?@theme \{.*?\})', base_css, re.DOTALL)
if prelude_match:
    tailwind_config = prelude_match.group(1)
    base_css = base_css.replace(tailwind_config, '').strip()
else:
    tailwind_config = ""

with open("src/styles/base.css", "w", encoding="utf-8") as f:
    f.write(base_css + "\n\n")
    for name in file_mapping['base.css']:
        if name in sections:
            f.write(f"/* {name} */\n" + sections[name] + "\n\n")

for css_file in ['layout.css', 'components.css', 'pages.css']:
    with open(f"src/styles/{css_file}", "w", encoding="utf-8") as f:
        for name in file_mapping[css_file]:
            if name in sections:
                f.write(f"/* {name} */\n" + sections[name] + "\n\n")

# Write index.css
with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(tailwind_config + "\n\n")
    f.write("@import './styles/base.css';\n")
    f.write("@import './styles/layout.css';\n")
    f.write("@import './styles/components.css';\n")
    f.write("@import './styles/pages.css';\n")

print("CSS segmentation complete.")
