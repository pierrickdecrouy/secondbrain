import re

with open('src/components/NetworkTooltip.css', 'r') as f:
    css = f.read()

css = css.replace('width: 280px;', 'width: max-content;\n    min-width: 280px;\n    max-width: 360px;')

with open('src/components/NetworkTooltip.css', 'w') as f:
    f.write(css)

