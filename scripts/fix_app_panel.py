import re

with open('src/App.tsx', 'r') as f:
    app = f.read()

# Replace CardSidePanel style inside the network view wrapper
old_panel_style = """                          <div style={{
                              width: '500px',
                              flexShrink: 0,
                              backgroundColor: 'var(--color-bg-base)',
                              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                              zIndex: 100,
                              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
                              display: 'flex', flexDirection: 'column'
                          }}>"""

# If it had position absolute, it would be there. Wait, I didn't see position absolute earlier!
