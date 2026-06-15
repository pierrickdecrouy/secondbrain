import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Make the dark theme deeper and more premium
new_vars = """html.dark {
  color-scheme: dark;
  --color-bg: #0a0f18;
  --color-surface: #131a28;
  --color-border: #1e293b;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 32px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.7);
  --pharma-bg-modal: #131a28;
  --pharma-bg-sidebar: #0a0f18;
  --pharma-text-main: #f8fafc;
  --pharma-text-muted: #94a3b8;
  --pharma-border: #1e293b;
}"""

css = re.sub(r'html\.dark \{\n  color-scheme: dark;.*?--pharma-border: #334155;\n\}', new_vars, css, flags=re.DOTALL)

with open('src/index.css', 'w') as f:
    f.write(css)

