import re

with open('src/components/FullCourseEditor.tsx', 'r') as f:
    code = f.read()

# 1. Change button color to green
old_btn = "background: '#0369a1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(3,105,161,0.2)'"
new_btn = "background: '#047857', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'"
code = code.replace(old_btn, new_btn)

# 2. Improve responsive layout of the header fields
old_header = """<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Matière:</span>
                            <input 
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ex: Cardiologie..."
                                style={{ flex: 1, minWidth: '150px', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)', padding: '6px 12px', borderRadius: '6px' }}
                            />
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500, marginLeft: '8px' }}>Tags:</span>
                            <input 
                                type="text"
                                value={tagsText}
                                onChange={(e) => setTagsText(e.target.value)}
                                placeholder="physiologie, rein, hormones..."
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)', padding: '6px 12px', borderRadius: '6px' }}
                            />
                        </div>"""

new_header = """<div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 250px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Matière:</span>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ex: Cardiologie..."
                                    style={{ flex: 1, minWidth: '150px', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)', padding: '6px 12px', borderRadius: '6px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Tags:</span>
                                <input 
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                    placeholder="physiologie, rein, hormones..."
                                    style={{ flex: 1, minWidth: '150px', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'var(--color-bg)', padding: '6px 12px', borderRadius: '6px' }}
                                />
                            </div>
                        </div>"""
code = code.replace(old_header, new_header)

# 3. Add responsive padding to the editor container
# Old: <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' }}>
#      <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
#      <div style={{ padding: '32px 48px 16px 48px', borderBottom: '1px solid var(--color-bg)' }}>
#      <div className="course-editor-toolbar" style={{ padding: '12px 48px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', backgroundColor: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 5 }}>
#      <div style={{ padding: '32px 48px 64px 48px', flex: 1, cursor: 'text' }} onClick={() => editor.chain().focus().run()}>

code = code.replace(
    "padding: '32px'",
    "padding: '16px'"
).replace(
    "padding: '32px 48px 16px 48px'",
    "padding: '24px 24px 16px 24px'"
).replace(
    "padding: '12px 48px'",
    "padding: '12px 24px'"
).replace(
    "padding: '32px 48px 64px 48px'",
    "padding: '24px 24px 64px 24px'"
)

with open('src/components/FullCourseEditor.tsx', 'w') as f:
    f.write(code)

