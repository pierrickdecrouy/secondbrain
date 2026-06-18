import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    bp = f.read()

# Replace flex logic to only squeeze to 50% if there is a selected card
bp = bp.replace(
    '''<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', height: viewMode === 'split' ? 'calc(100vh - 180px)' : 'auto' }}>
                    <div style={{ flex: viewMode === 'split' ? '0 0 50%' : '1', overflowY: viewMode === 'split' ? 'auto' : 'visible', paddingRight: viewMode === 'split' ? '1rem' : 0 }}>''',
    '''<div style={{ display: viewMode === 'split' ? 'flex' : 'block', gap: '1rem', height: viewMode === 'split' ? 'calc(100vh - 180px)' : 'auto', justifyContent: 'center' }}>
                    <div style={{ flex: (viewMode === 'split' && selectedCard) ? '0 0 50%' : '1', overflowY: viewMode === 'split' ? 'auto' : 'visible', paddingRight: (viewMode === 'split' && selectedCard) ? '1rem' : 0, transition: 'all 0.3s ease-in-out' }}>'''
)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(bp)

