import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

# Replace the selectedCard block
target = """            {selectedCard && (
                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    actions={
                        <div className="modal-actions">
                            <button className="btn-icon" onClick={() => { setEditingCard(selectedCard); setAddDataMode('edit'); }} title="Modifier">
                                <PencilSimple size={18} />
                            </button>
                            <button className="btn-icon" onClick={() => setCardToDelete(selectedCard)} title="Supprimer">
                                <Trash size={18} />
                            </button>
                        </div>
                    }
                    onNext={() => {
                        const idx = sortedCards.findIndex(c => c.id === selectedCardId);
                        if (idx >= 0 && idx < sortedCards.length - 1) {
                            setSelectedCardId(sortedCards[idx + 1].id);
                        }
                    }}
                    onPrev={() => {
                        const idx = sortedCards.findIndex(c => c.id === selectedCardId);
                        if (idx > 0) {
                            setSelectedCardId(sortedCards[idx - 1].id);
                        }
                    }}
                />
            )}"""

replacement = """            {selectedCard && viewMode !== 'split' && (
                <DetailModal
                    card={selectedCard}
                    allCards={cards}
                    onClose={() => setSelectedCardId(null)}
                    onLinkClick={(id) => setSelectedCardId(id)}
                    actions={
                        <div className="modal-actions">
                            <button className="btn-icon" onClick={() => { setEditingCard(selectedCard); setAddDataMode('edit'); }} title="Modifier">
                                <PencilSimple size={18} />
                            </button>
                            <button className="btn-icon" onClick={() => setCardToDelete(selectedCard)} title="Supprimer">
                                <Trash size={18} />
                            </button>
                        </div>
                    }
                    onNext={() => {
                        const idx = sortedCards.findIndex(c => c.id === selectedCardId);
                        if (idx >= 0 && idx < sortedCards.length - 1) {
                            setSelectedCardId(sortedCards[idx + 1].id);
                        }
                    }}
                    onPrev={() => {
                        const idx = sortedCards.findIndex(c => c.id === selectedCardId);
                        if (idx > 0) {
                            setSelectedCardId(sortedCards[idx - 1].id);
                        }
                    }}
                />
            )}

            {selectedCard && viewMode === 'split' && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, width: '50%',
                    backgroundColor: 'var(--color-bg-base)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderRight: '1px solid var(--border-light)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <CardSidePanel
                        card={selectedCard}
                        allCards={cards}
                        onClose={() => setSelectedCardId(null)}
                        onPinToggle={() => {}}
                        pinned={false}
                        onLinkClick={(id) => setSelectedCardId(id)}
                        onPrev={(() => {
                            const idx = sortedCards.findIndex(c => c.id === selectedCard.id);
                            if (idx > 0) return () => setSelectedCardId(sortedCards[idx - 1].id);
                            return undefined;
                        })()}
                        onNext={(() => {
                            const idx = sortedCards.findIndex(c => c.id === selectedCard.id);
                            if (idx >= 0 && idx < sortedCards.length - 1) return () => setSelectedCardId(sortedCards[idx + 1].id);
                            return undefined;
                        })()}
                    />
                    <style>
                        {`
                        @keyframes slideInLeft {
                            from { transform: translateX(-100%); }
                            to { transform: translateX(0); }
                        }
                        `}
                    </style>
                </div>
            )}"""

code = code.replace(target, replacement)

# ensure the main div is relative so the absolute side panel positions correctly
code = code.replace('<div className="browse-container">', '<div className="browse-container" style={{ position: "relative" }}>')

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

