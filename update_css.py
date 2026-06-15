import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Remove the bad html.dark overrides for .home-search-box input at the bottom of the file
bad_override_pattern = re.compile(r'html\.dark \.home-search-box input \{.*?\n\}\n\nhtml\.dark \.home-search-box input:focus \{.*?\n\}\n', re.DOTALL)
css = re.sub(bad_override_pattern, '', css)

# We will add properly styled classes for the home page buttons
new_css = """
/* Home Page specific components */
.review-status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  width: 100%;
}

.review-status-card.has-reviews {
  background: var(--color-surface);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
  border: 2px solid rgba(99, 102, 241, 0.3);
}

.review-status-card.all-done {
  background: rgba(0, 0, 0, 0.03);
  border: 1px dashed var(--color-border);
  box-shadow: none;
}

html.dark .review-status-card.all-done {
  background: rgba(255, 255, 255, 0.03);
}

.review-status-card:hover {
  transform: translateY(-2px);
}

.review-status-card.has-reviews:hover {
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.5);
}

.secondary-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

html.dark .secondary-action-btn {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.secondary-action-btn:hover {
  transform: translateY(-1px);
  background: var(--color-bg);
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

html.dark .secondary-action-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--color-drug);
}

html.dark .home-greeting span {
  background: linear-gradient(135deg, #34d399, #a78bfa); /* Brighter emerald to violet for dark mode */
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
"""

css += "\n" + new_css

with open('src/index.css', 'w') as f:
    f.write(css)

