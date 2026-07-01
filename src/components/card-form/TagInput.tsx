import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';

interface TagInputProps {
    tags: string[];
    uniqueTags: string[];
    onAddTag: (tag: string) => void;
    onRemoveTag: (tag: string) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, uniqueTags, onAddTag, onRemoveTag }) => {
    const [tagInput, setTagInput] = useState('');

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                onAddTag(tagInput.trim());
                setTagInput('');
            }
        } else if (e.key === ',' || e.key === ' ') {
            e.preventDefault();
            if (tagInput.trim()) {
                onAddTag(tagInput.trim());
                setTagInput('');
            }
        }
    };

    const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value) {
            onAddTag(e.target.value);
            e.target.value = "";
        }
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 }}>
            {tags.map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', fontSize: '0.85rem', fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 24, color: 'var(--color-text)' }}>
                    #{tag}<X size={12} onClick={() => onRemoveTag(tag)} style={{ cursor: 'pointer', opacity: 0.6 }} />
                </span>
            ))}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--color-bg)', borderRadius: 24, overflow: 'hidden', height: 28, border: '1px dashed var(--color-border)', padding: '0 8px' }}>
                <input
                    type="text"
                    placeholder="+ Tag (Enter, virgule...)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: 140, height: '100%', color: 'var(--color-text-muted)' }}
                />
                {uniqueTags.filter(t => !tags.includes(t)).length > 0 && (
                    <select
                        onChange={handleTagSelect}
                        defaultValue=""
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer', height: '100%', padding: '0 4px' }}
                    >
                        <option value="" disabled>↓</option>
                        {uniqueTags.filter(t => !tags.includes(t)).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};
