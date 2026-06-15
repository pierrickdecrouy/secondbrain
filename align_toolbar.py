import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

old_sort = """                    {/* Sort Dropdown */}
                    {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="browse-view-toggle" style={{ padding: '6px' }}>
                            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <ArrowsDownUp size={16} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    style={{
                                        appearance: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '4px 12px 4px 32px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >"""

new_sort = """                    {/* Sort Dropdown */}
                    {(viewMode === 'grid' || viewMode === 'list') && (
                        <div className="browse-view-toggle" style={{ padding: '4px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <ArrowsDownUp size={16} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    style={{
                                        appearance: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '6px 12px 6px 32px',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-text)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                >"""

code = code.replace(old_sort, new_sort)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

