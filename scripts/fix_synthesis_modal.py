import re

with open('src/components/BrowsePage.tsx', 'r') as f:
    code = f.read()

target = """            {synthesisPanelCard && (
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
                }}>"""

replacement = """            {synthesisPanelCard && (
                <div style={{
                    position: viewMode === 'split' ? 'absolute' : 'fixed',
                    top: 0, 
                    right: viewMode === 'split' ? 'auto' : 0, 
                    left: viewMode === 'split' ? 0 : 'auto', 
                    bottom: 0, 
                    width: viewMode === 'split' ? '50%' : '400px',
                    maxWidth: '100vw',
                    backgroundColor: 'var(--color-bg-base)',
                    boxShadow: viewMode === 'split' ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    animation: viewMode === 'split' ? 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderLeft: viewMode === 'split' ? 'none' : '1px solid var(--border-light)',
                    borderRight: viewMode === 'split' ? '1px solid var(--border-light)' : 'none',
                    display: 'flex', flexDirection: 'column'
                }}>"""

code = code.replace(target, replacement)

with open('src/components/BrowsePage.tsx', 'w') as f:
    f.write(code)

