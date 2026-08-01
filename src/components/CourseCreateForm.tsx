import React, { useState } from 'react';
import type { Card } from '../types';
import { COURSE_TYPE, generateId } from '../types';
import { TagInput } from './card-form/TagInput';
import { FloppyDisk } from '@phosphor-icons/react';

interface CourseCreateFormProps {
    existingCards: Card[];
    onSave: (card: Card) => void;
    onCancel: () => void;
}

export const CourseCreateForm: React.FC<CourseCreateFormProps> = ({ existingCards, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const handleSave = () => {
        if (!title.trim()) return;

        const newCourse: Card = {
            id: generateId(),
            type: COURSE_TYPE,
            nodeType: 'course',
            format: 'q&a', // Default format, doesn't really matter for courses
            title: title.trim(),
            subtitle: '',
            content: '',
            details: '',
            tags,
            subject: subject.trim() || undefined,
            manualConnections: [],
            suppressedConnections: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        onSave(newCourse);
    };

    const addTag = (tag: string) => {
        const t = tag.trim().toLowerCase();
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const uniqueTags = Array.from(new Set(existingCards.flatMap(c => c.tags || []))).sort();

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            <div className="p-10 flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Créer un nouveau Cours</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Définissez les bases de votre cours. Vous serez ensuite redirigé vers l'éditeur complet pour ajouter du contenu, des concepts et lier vos fiches.
                    </p>
                </div>

                <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Titre du cours *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Cardiologie générale..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Matière / Module
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Ex: Médecine, Pharmacie, Biologie..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Tags
                        </label>
                        <TagInput
                            tags={tags}
                            uniqueTags={uniqueTags}
                            onAddTag={addTag}
                            onRemoveTag={removeTag}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-white dark:bg-slate-900 transition-colors text-sm font-medium cursor-pointer bg-transparent"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white border-none hover:bg-indigo-700 transition-colors text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FloppyDisk size={18} weight="bold" />
                        Créer le cours
                    </button>
                </div>
            </div>
        </div>
    );
};
