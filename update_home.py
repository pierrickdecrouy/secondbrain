import re

with open('src/components/HomePage.tsx', 'r') as f:
    content = f.read()

# Fix the review card background
content = content.replace("background: totalToReview > 0 ? 'var(--color-surface)' : 'rgba(255, 255, 255, 0.5)',", "")
content = content.replace("boxShadow: totalToReview > 0 ? '0 8px 32px rgba(99, 102, 241, 0.15)' : 'none',", "")
content = content.replace("border: totalToReview > 0 ? '2px solid rgba(99, 102, 241, 0.3)' : '1px dashed var(--color-border)',", "")

# The secondary action buttons: remove hardcoded background, border, boxShadow inline styles
content = re.sub(r"background: 'var\(--color-surface\)',\s*border: '1px solid var\(--color-border\)',\s*color: 'var\(--color-text\)',\s*fontSize: '0\.95rem',\s*fontWeight: 600,\s*cursor: 'pointer',\s*transition: 'all 0\.2s ease',\s*boxShadow: 'var\(--shadow\)'", "color: 'var(--color-text)'", content)

with open('src/components/HomePage.tsx', 'w') as f:
    f.write(content)

