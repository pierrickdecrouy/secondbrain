import re

with open('src/App.tsx', 'r') as f:
    app = f.read()

# Fix DetailModal inside modals
app = app.replace(
    '          onNext={handleNextCard}\n                                  onExpand={() => setExpandedCardId(selectedCard.id)}\n          onPrev={handlePrevCard}\n',
    ''
)

# And what about CardSidePanel in App.tsx? It uses handleNextCard.
# CardSidePanel is around line 900, which is AFTER handleNextCard (line 610).
# So that is fine!

with open('src/App.tsx', 'w') as f:
    f.write(app)
