import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    content = f.read()

# Add synthesisPanelCardId state
state_match = re.search(r'const \[selectedCardId, setSelectedCardId\] = useState<string \| null>\(null\);', content)
if state_match:
    content = content.replace(state_match.group(0), state_match.group(0) + '\n    const [synthesisPanelCardId, setSynthesisPanelCardId] = useState<string | null>(null);')

# Add synthesisPanelCard memo
memo_match = re.search(r'const selectedCard = useMemo\(\(\) => \{.*?\}, \[cards, selectedCardId\]\);', content, re.DOTALL)
if memo_match:
    synthesis_memo = """
    const synthesisPanelCard = useMemo(() => {
        if (!synthesisPanelCardId) return null;
        return cards.find(c => c.id === synthesisPanelCardId) || null;
    }, [cards, synthesisPanelCardId]);
    """
    content = content.replace(memo_match.group(0), memo_match.group(0) + synthesis_memo)

# Update onCardClick in SearchSynthesis
search_synthesis_match = re.search(r'<SearchSynthesis[\s\S]*?onCardClick=\{setSelectedCardId\}[\s\S]*?/>', content)
if search_synthesis_match:
    updated_synthesis = search_synthesis_match.group(0).replace('onCardClick={setSelectedCardId}', 'onCardClick={setSynthesisPanelCardId}')
    content = content.replace(search_synthesis_match.group(0), updated_synthesis)

# Add CardSidePanel render at the bottom of BrowsePage
bottom_match = re.search(r'</div >\s*\n\s*\);\s*\n\};', content)
if bottom_match:
    panel_render = """
            {synthesisPanelCard && viewMode !== 'network' && (
                <div style={{
                    position: 'fixed',
                    top: 0, right: 0, bottom: 0, width: '400px',
                    maxWidth: '100vw',
                    backgroundColor: 'var(--color-bg-base)',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderLeft: '1px solid var(--border-light)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <CardSidePanel
                        card={synthesisPanelCard}
                        allCards={cards}
                        onClose={() => setSynthesisPanelCardId(null)}
                        onPinToggle={() => {}}
                        pinned={false}
                        onLinkClick={(id) => {
                            setSynthesisPanelCardId(id);
                        }}
                    />
                    <style>
                        {`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                        `}
                    </style>
                </div>
            )}
    """
    content = content.replace(bottom_match.group(0), panel_render + bottom_match.group(0))

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(content)

