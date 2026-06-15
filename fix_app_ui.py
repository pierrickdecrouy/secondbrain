import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove duplicated states
states_to_remove = [
    r"  const \[searchQuery, setSearchQuery\] = useState\(''\);\n",
    r"  const \[activeFilters, setActiveFilters\] = useState<string\[\]>\(\[\]\);\n",
    r"  const \[viewMode, setViewMode\] = useState<ViewMode>\('grid'\);\n",
    r"  const \[addDataMode, setAddDataMode\] = useState<'none' \| 'create' \| 'edit' \| 'import'>\('none'\);\n",
    r"  const \[sidebarOpen, setSidebarOpen\] = useState\(false\);\n",
    r"  const \[sidebarCollapsed, setSidebarCollapsed\] = useState\(\(\) => \{[\s\S]*?\}\);\n",
    r"  const \[isProfileMenuOpen, setProfileMenuOpen\] = useState\(false\);\n",
    r"  const \[userName, setUserName\] = useState\('Pierrick'\);\n",
    r"  useEffect\(\(\) => \{\n    localStorage\.setItem\('sidebarCollapsed', sidebarCollapsed\.toString\(\)\);\n  \}, \[sidebarCollapsed\]\);\n"
]

for pattern in states_to_remove:
    content = re.sub(pattern, "", content)

# Inject useUI()
useui_inject = "  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, isProfileMenuOpen, setProfileMenuOpen, userName, setUserName, addDataMode, setAddDataMode, searchQuery, setSearchQuery, activeFilters, setActiveFilters, viewMode, setViewMode } = useUI();"

content = content.replace("  const { darkMode, toggleDarkMode } = useTheme();", "  const { darkMode, toggleDarkMode } = useTheme();\n" + useui_inject)

# Also ensure workspace-shell uses sidebarCollapsed correctly
content = content.replace("    <div className={`workspace-shell ${isHomeSection ? 'home-layout' : ''} ${isHomeSection && sidebarOpen ? 'home-sidebar-open' : ''}`}>",
                          "    <div className={`workspace-shell ${isHomeSection ? 'home-layout' : ''} ${isHomeSection && sidebarOpen ? 'home-sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>")

with open('src/App.tsx', 'w') as f:
    f.write(content)
