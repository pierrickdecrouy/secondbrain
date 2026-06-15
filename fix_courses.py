import re

with open('src/components/CoursesPage.tsx', 'r') as f:
    courses = f.read()

courses = courses.replace(
    'onClick={() => setIsCreating(true)}',
    '''onClick={() => {
                                    setEditingCourse({
                                        id: `course-${Date.now()}`,
                                        title: '',
                                        type: 'course',
                                        content: '',
                                        createdAt: Date.now(),
                                        updatedAt: Date.now()
                                    });
                                    setIsCreating(true);
                                }}'''
)

with open('src/components/CoursesPage.tsx', 'w') as f:
    f.write(courses)

