import re

with open('src/index.css', 'r') as f:
    content = f.read()

new_css = """
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

# Replace the block
pattern = re.compile(r'\.search-wrapper \{.*?\.search-input:focus \{.*?\}', re.DOTALL)
content = re.sub(pattern, new_css.strip(), content)

with open('src/index.css', 'w') as f:
    f.write(content)

