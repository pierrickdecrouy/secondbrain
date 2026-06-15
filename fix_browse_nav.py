import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

target1 = """    const selectedCard = useMemo(() => {
        if (!selectedCardId) return null;
        return cards.find(c => c.id === selectedCardId) || null;
    }, [cards, selectedCardId]);"""
replacement1 = """    const selectedCard = useMemo(() => {
        if (!selectedCardId) return null;
        return cards.find(c => c.id === selectedCardId) || null;
    }, [cards, selectedCardId]);

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
    };

    const synthesisIndex = filteredCards.findIndex(c => c.id === synthesisPanelCardId);
    const handleNextSynthesis = () => {
        if (synthesisIndex >= 0 && synthesisIndex < filteredCards.length - 1) {
            setSynthesisPanelCardId(filteredCards[synthesisIndex + 1].id);
        }
    };
    const handlePrevSynthesis = () => {
        if (synthesisIndex > 0) {
            setSynthesisPanelCardId(filteredCards[synthesisIndex - 1].id);
        }
    };"""

code = code.replace(target1, replacement1)

target2 = """                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}"""
replacement2 = """                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    onNext={handleNextCard}
                    onPrev={handlePrevCard}"""

code = code.replace(target2, replacement2)

target3 = """                    <CardSidePanel
                        card={synthesisPanelCard}
                        allCards={cards}
                        onClose={() => setSynthesisPanelCardId(null)}
                        onPinToggle={() => {}} // Remove pin functionality for now
                        pinned={false}
                        onLinkClick={(id) => setSynthesisPanelCardId(id)}
                    />"""
replacement3 = """                    <CardSidePanel
                        card={synthesisPanelCard}
                        allCards={cards}
                        onClose={() => setSynthesisPanelCardId(null)}
                        onPinToggle={() => {}} // Remove pin functionality for now
                        pinned={false}
                        onLinkClick={(id) => setSynthesisPanelCardId(id)}
                        onNext={handleNextSynthesis}
                        onPrev={handlePrevSynthesis}
                    />"""

code = code.replace(target3, replacement3)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

