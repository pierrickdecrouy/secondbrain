import React, { useState } from 'react';
import { X, CaretDown } from '@phosphor-icons/react';

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
        <div className="flex flex-wrap items-center gap-2">
            {tags.map(tag => (
                <span key={tag} className="text-[11px] font-semibold py-1 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    #{tag}
                    <X size={12} weight="bold" onClick={() => onRemoveTag(tag)} className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors" />
                </span>
            ))}
            
            <div className="flex items-center gap-1.5 py-1 px-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 w-48 bg-transparent">
                <span className="font-bold">+</span>
                <input
                    type="text"
                    placeholder="Tag (Enter, virgule...)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 placeholder-opacity-70"
                />
                {uniqueTags.filter(t => !tags.includes(t)).length > 0 && (
                    <div className="relative flex items-center shrink-0">
                        <select
                            onChange={handleTagSelect}
                            defaultValue=""
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="" disabled>↓</option>
                            {uniqueTags.filter(t => !tags.includes(t)).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <CaretDown size={12} weight="bold" className="pointer-events-none text-slate-500" />
                    </div>
                )}
            </div>
        </div>
    );
};
