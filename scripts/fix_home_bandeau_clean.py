import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Remove the .home-page block I added at the end
css = re.sub(r'\.home-page \{\n  min-height: 100vh;\n  /\* margin-top removed since absolute header removes it from flow \*/\n  padding-top: 80px; /\* Keep content pushed down \*/\n\}\n', '', css)

with open('src/index.css', 'w') as f:
    f.write(css)

