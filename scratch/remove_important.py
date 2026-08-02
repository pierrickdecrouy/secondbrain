import glob
import re

for filename in glob.glob("src/styles/*.css"):
    with open(filename, 'r') as f:
        content = f.read()
    
    # In base.css, we want to keep !important in prefers-reduced-motion block
    if "base.css" in filename:
        # Just replace anywhere else except line 7-14
        pass # Actually prefers-reduced-motion is standard accessibility, let's keep it.
        # I'll just skip base.css as it only has 4 !important and they are for prefers-reduced-motion
        continue
    
    # Remove !important
    # We replace " !important" with ""
    new_content = re.sub(r'\s*!important', '', content)
    
    with open(filename, 'w') as f:
        f.write(new_content)
    
    print(f"Removed !important from {filename}")

