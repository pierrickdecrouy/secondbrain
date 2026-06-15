import re

# 1. Fix AddDataModal alignment (App.tsx)
with open('src/App.tsx', 'r') as f:
    app = f.read()

app = app.replace(
    'layout={activeSection === \'cards\' ? \'drawer\' : \'modal\'}',
    'layout="modal"'
)

with open('src/App.tsx', 'w') as f:
    f.write(app)

# 2. Fix HomePage subtitle alignment and padding
with open('src/components/HomePage.tsx', 'r') as f:
    home = f.read()

home = home.replace(
    '<div className="home-content app-no-drag" style={{ paddingTop: \'6rem\' }}>',
    '<div className="home-content app-no-drag" style={{ paddingTop: \'2rem\' }}>'
)
home = home.replace(
    '<p className="home-subtitle" style={{ minHeight: \'1.5rem\', transition: \'opacity 0.5s ease-in-out\' }}>',
    '<p className="home-subtitle" style={{ minHeight: \'1.5rem\', transition: \'opacity 0.5s ease-in-out\', width: \'100%\', textAlign: \'left\', paddingLeft: \'0\' }}>'
)
# Make the greeting align left as well, if it's not already
home = home.replace(
    '<h1 className="home-greeting">',
    '<h1 className="home-greeting" style={{ width: \'100%\', textAlign: \'left\' }}>'
)

with open('src/components/HomePage.tsx', 'w') as f:
    f.write(home)

# 3. Add clear button to BrowsePage.tsx search bar
with open('src/components/BrowsePage.tsx', 'r') as f:
    bp = f.read()

search_input_old = '''                        <input
                            type="text"
                            className="browse-search-input"
                            placeholder="Rechercher par titre, contenu, mots-clés..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />'''

search_input_new = '''                        <input
                            type="text"
                            className="browse-search-input"
                            placeholder="Rechercher par titre, contenu, mots-clés..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="browse-search-clear"
                                title="Effacer"
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                            >
                                <X size={14} weight="bold" />
                            </button>
                        )}'''

bp = bp.replace(search_input_old, search_input_new)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(bp)

