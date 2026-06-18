import re

# App.tsx
with open('src/App.tsx', 'r') as f:
    app = f.read()

# Replace onClose in DetailModal
old_close_app = 'onClose={() => { setSelectedCardId(null); setExpandedCardId(null); }}'
new_close_app = '''onClose={() => { 
            setExpandedCardId(null);
            if (!isNetworkContext) {
              setSelectedCardId(null);
            }
          }}'''
app = app.replace(old_close_app, new_close_app)

with open('src/App.tsx', 'w') as f:
    f.write(app)

# BrowsePage.tsx
with open('src/components/BrowsePage.tsx', 'r') as f:
    bp = f.read()

old_close_bp = 'onClose={() => { setSelectedCardId(null); setExpandedCardId(null); }}'
new_close_bp = '''onClose={() => {
                        setExpandedCardId(null);
                        if (viewMode !== 'split') {
                            setSelectedCardId(null);
                        }
                    }}'''
bp = bp.replace(old_close_bp, new_close_bp)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(bp)

