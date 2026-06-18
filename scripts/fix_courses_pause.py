import re

with open('src/components/CoursesPage.tsx', 'r') as f:
    code = f.read()

old_pause = '''                onPause={(draft) => {
                    onPause?.(draft);
                    setEditingCourse(null);
                }}'''

new_pause = '''                onPause={(draft) => {
                    onPause?.(draft);
                }}'''

code = code.replace(old_pause, new_pause)

with open('src/components/CoursesPage.tsx', 'w') as f:
    f.write(code)

