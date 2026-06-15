import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# 1. Force viewMode from 'network' to 'grid' on load
hook_code = """
    useEffect(() => {
        if (viewMode === 'network') {
            setViewMode('grid');
        }
    }, [viewMode, setViewMode]);
"""
code = code.replace("    const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);\n", "    const { filteredCards } = useFilteredCards(cards, searchQuery, activeFilters);\n" + hook_code)
# make sure useEffect is imported
if "useEffect" not in code.split("from 'react'")[0]:
    code = code.replace("import React, { useState, useMemo }", "import React, { useState, useMemo, useEffect }")

# 2. Add Split View toggle
toggle_split_code = """
                            <button
                                className={`browse-view-btn ${viewMode === 'split' ? 'active' : ''}`}
                                onClick={() => setViewMode('split')}
                                style={{ margin: 0, padding: '6px 12px', borderRadius: '10px', border: 'none', background: viewMode === 'split' ? 'var(--color-bg)' : 'transparent', color: viewMode === 'split' ? 'var(--color-drug)' : 'var(--color-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <SquaresFour size={18} /> Mixte
                            </button>
"""
code = code.replace("<Rows size={18} /> Liste\n                            </button>", "<Rows size={18} /> Liste\n                            </button>\n" + toggle_split_code)

# 3. Change viewMode !== 'network' condition for toggles since we want it always visible
code = code.replace("{viewMode !== 'network' && (", "{true && (")

# 4. Modify layout to support Split view
# Wrap grid and list
grid_list_wrapper = """
                <div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', height: viewMode === 'split' ? 'calc(100vh - 180px)' : 'auto' }}>
                    <div style={{ flex: viewMode === 'split' ? '0 0 50%' : '1', overflowY: viewMode === 'split' ? 'auto' : 'visible', paddingRight: viewMode === 'split' ? '1rem' : 0 }}>
"""
code = code.replace("{viewMode === 'grid' && (", grid_list_wrapper + "\n                {(viewMode === 'grid' || viewMode === 'split') && (")

# End of List block
end_list_block = """
                        </div>
                    )
                }
"""
new_end_list_block = end_list_block + """
                    </div>
                    {viewMode === 'split' && (
                        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                            {renderNetworkView && renderNetworkView()}
                        </div>
                    )}
                </div>
"""
code = code.replace(end_list_block, new_end_list_block)

# 5. Remove the old viewMode === 'network' layout
old_network_layout = """
                {
                    viewMode === 'network' && (
                        <div 
                            className={`browse-network-layout ${networkPanelCard ? 'has-panel' : ''}`}
                            style={networkPanelCard && window.innerWidth > 650 ? { gridTemplateColumns: `minmax(0, 1fr) ${panelWidth}px` } : {}}
                        >
                            <div className="browse-network-container">
                                {renderNetworkView && renderNetworkView()}
                            </div>
                            {networkPanelCard && (
                                <>
                                    <div 
                                        className="network-panel-resizer hidden md:block" 
                                        onMouseDown={handleMouseDownResizer}
                                        style={{
                                            position: 'absolute',
                                            right: `${panelWidth - 3}px`,
                                            top: 0,
                                            bottom: 0,
                                            width: '6px',
                                            cursor: 'col-resize',
                                            zIndex: 60,
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                    <CardSidePanel
                                        card={networkPanelCard}
                                        allCards={cards}
                                        onClose={() => onNetworkPanelClose?.()}
                                        onPinToggle={() => onNetworkPanelPinToggle?.()}
                                        pinned={Boolean(networkPanelPinned)}
                                        onLinkClick={setSelectedCardId}
                                        onPrev={(() => {
                                            const idx = sortedCards.findIndex(c => c.id === networkPanelCard.id);
                                            if (idx > 0) return () => setSelectedCardId(sortedCards[idx - 1].id);
                                            return undefined;
                                        })()}
                                        onNext={(() => {
                                            const idx = sortedCards.findIndex(c => c.id === networkPanelCard.id);
                                            if (idx >= 0 && idx < sortedCards.length - 1) return () => setSelectedCardId(sortedCards[idx + 1].id);
                                            return undefined;
                                        })()}
                                    />
                                </>
                            )}
                        </div>
                    )
                }
"""
code = code.replace(old_network_layout, "")

# 6. Change active selected card modal behavior in split mode
# In split mode, we probably still want the DetailModal to open if clicked from the left,
# or we can show it in CardSidePanel. DetailModal is fine for now, it overlaps both.
code = code.replace("{selectedCard && viewMode !== 'network' && (", "{selectedCard && (")
code = code.replace("{synthesisPanelCard && viewMode !== 'network' && (", "{synthesisPanelCard && (")

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

