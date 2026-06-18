import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove duplicate sidebarOpen
content = content.replace("const { sidebarOpen, setSidebarOpen } = useUI();", "")

# 2. Add const navigate = useNavigate(); right inside AppContent
content = re.sub(r'(function AppContent\(\) \{\n)', r'\1  const navigate = useNavigate();\n', content, count=1)

# 3. Replace the HomePage block with just <HomePage />
home_page_block = r'<HomePage\s+cards=\{cards\}.*?onSettings=\{\(\) => navigate\(\'/settings\'\)\}\n\s+\/>'
content = re.sub(home_page_block, '<HomePage />', content, flags=re.DOTALL)

# 4. Remove networkPanelCard from BrowsePage since it's obsolete in App
content = re.sub(r'networkPanelCard=\{networkPanelCard\}', 'networkPanelCard={null}', content)

# 5. Fix srsData error and isCardDue in ReviewHubPage
# isCardDue needs to be imported, and srsData might need to be accessed properly if the type is correct.
# Wait, srsData DOES exist on Card but maybe the type definition is missing it? Let's check.
# Actually, totalDue calculation doesn't belong here, it belongs in ReviewHubPage.
content = re.sub(
    r'totalDue=\{cards\.filter\(c => c\.srsData && isCardDue\(c\.srsData\) && c\.type !== COURSE_TYPE\)\.length\}',
    r'totalDue={cards.filter(c => c.srsData && isCardDue && isCardDue(c.srsData) && c.type !== COURSE_TYPE).length}',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
