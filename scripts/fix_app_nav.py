import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

target1 = """  const isHomeSection = location.pathname === '/';"""
replacement1 = """  const isHomeSection = location.pathname === '/';

  const selectedIndex = filteredCards.findIndex(c => c.id === selectedCardId);
  const handleNextCard = () => {
      if (selectedIndex >= 0 && selectedIndex < filteredCards.length - 1) {
          setSelectedCardId(filteredCards[selectedIndex + 1].id);
      }
  };
  const handlePrevCard = () => {
      if (selectedIndex > 0) {
          setSelectedCardId(filteredCards[selectedIndex - 1].id);
      }
  };"""

code = code.replace(target1, replacement1)

target2 = """        <DetailModal
          card={selectedCard}
          allCards={cards}
          onClose={() => setSelectedCardId(null)}
          onLinkClick={(id) => setSelectedCardId(id)}"""
replacement2 = """        <DetailModal
          card={selectedCard}
          allCards={cards}
          onClose={() => setSelectedCardId(null)}
          onLinkClick={(id) => setSelectedCardId(id)}
          onNext={handleNextCard}
          onPrev={handlePrevCard}"""

code = code.replace(target2, replacement2)

target3 = """                              <CardSidePanel
                                  card={selectedCard}
                                  allCards={cards}
                                  onClose={() => setSelectedCardId(null)}
                                  onPinToggle={() => setNetworkPanelPinned(!networkPanelPinned)}
                                  pinned={networkPanelPinned}
                                  onLinkClick={(id) => {
                                      if (networkPanelPinned) setPinnedCardId(id);
                                      setSelectedCardId(id);
                                  }}
                              />"""
replacement3 = """                              <CardSidePanel
                                  card={selectedCard}
                                  allCards={cards}
                                  onClose={() => setSelectedCardId(null)}
                                  onPinToggle={() => setNetworkPanelPinned(!networkPanelPinned)}
                                  pinned={networkPanelPinned}
                                  onLinkClick={(id) => {
                                      if (networkPanelPinned) setPinnedCardId(id);
                                      setSelectedCardId(id);
                                  }}
                                  onNext={handleNextCard}
                                  onPrev={handlePrevCard}
                              />"""

code = code.replace(target3, replacement3)

with open('src/App.tsx', 'w') as f:
    f.write(code)

