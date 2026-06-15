import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    content = f.read()

# Fix unused navigate, handleDeleteCard, setSearchQuery, searchResultIds
content = content.replace("const navigate = useNavigate();\n", "")
content = content.replace("const { cards, handleDeleteCard, setEditingCard, setCardToDelete } = useCards();", "const { cards, setEditingCard, setCardToDelete } = useCards();")
content = content.replace("const { searchQuery, setSearchQuery, activeFilters, setActiveFilters, viewMode, setViewMode, setAddDataMode } = useUI();", "const { searchQuery, activeFilters, setActiveFilters, viewMode, setViewMode, setAddDataMode } = useUI();")
content = content.replace("const { filteredCards, searchResultIds } = useFilteredCards(cards, searchQuery, activeFilters);", "const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);")
content = content.replace("type ViewMode = 'grid' | 'list' | 'network';", "")

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(content)

