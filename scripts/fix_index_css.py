import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Replace .search-wrapper block completely
new_search_css = """
.search-wrapper {
  position: relative;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  transition: color 0.3s ease;
}

.search-input {
  width: 100%;
  padding: 1rem 1.25rem 1rem 3rem;
  font-size: 1.05rem;
  font-family: inherit;
  border: 2px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06), 0 2px 5px rgba(0,0,0,0.03);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-drug);
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.15), 0 8px 24px rgba(13, 148, 136, 0.1);
  transform: translateY(-1px);
}

.search-input:focus + .search-icon,
.search-wrapper:focus-within .search-icon {
  color: var(--color-drug);
}
"""
pattern_search = re.compile(r'\.search-wrapper \{.*?.search-input:focus \{.*?\}', re.DOTALL)
css = re.sub(pattern_search, new_search_css.strip(), css)

# Remove the bad overrides at the end of the file
bad_override = re.compile(r'html\.dark \.home-search-box input \{\n  background: var\(--color-surface\);\n  border-color: var\(--color-border\);\n  color: var\(--color-text\);\n  box-shadow: none;\n\}\n\nhtml\.dark \.home-search-box input:focus \{\n  background: var\(--color-surface\);\n\}')
css = re.sub(bad_override, '', css)

# Append the home page fixes
home_css = """
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
  color: var(--color-text);
}

html.dark .secondary-action-btn {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  color: var(--color-text);
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

with open('src/index.css', 'w') as f:
    f.write(css + '\n' + home_css)

