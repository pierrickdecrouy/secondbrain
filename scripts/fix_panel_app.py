import re

with open('src/App.tsx', 'r') as f:
    app = f.read()

# Make the CardSidePanel in App.tsx absolute so it overlays without squishing the canvas.
old_panel = """                          <div style={{
                              width: '500px',
                              flexShrink: 0,
                              backgroundColor: 'var(--color-bg-base)',
                              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                              zIndex: 100,
                              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
                              display: 'flex', flexDirection: 'column'
                          }}>"""

new_panel = """                          <div style={{
                              position: 'absolute',
                              top: 0, right: 0, bottom: 0,
                              width: '500px',
                              backgroundColor: 'var(--color-bg-base)',
                              boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.25)',
                              zIndex: 100,
                              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
                              display: 'flex', flexDirection: 'column'
                          }}>"""

app = app.replace(old_panel, new_panel)

with open('src/App.tsx', 'w') as f:
    f.write(app)

