import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import { Node, mergeAttributes } from '@tiptap/core';
import { Markdown } from 'tiptap-markdown';
import { CardSuggestionPlugin } from './editor/CardSuggestionPlugin';
import { getSuggestionOptions } from './editor/suggestionConfig';
import { 
    TextB, TextItalic, ListBullets, ListNumbers, HighlighterCircle,
    Table as TableIcon, Link as LinkIcon, Info, Warning, GraduationCap, Brain, Cards, EyeSlash
} from '@phosphor-icons/react';
import { ClozeExtension } from './editor/ClozeExtension';
import { usePromptStore } from '../store/usePromptStore';
import type { NodeViewProps } from '@tiptap/core';
import type { Card } from '../types';

// --- Custom Node for Medical Alerts ---

const MedicalAlertComponent = ({ node }: NodeViewProps) => {
    const type = node.attrs.type as string;
    
    const getTypeConfig = (t: string) => {
        switch (t) {
            case 'definition': return { icon: <Info weight="bold" />, title: 'Définition Clé' };
            case 'concours': return { icon: <GraduationCap weight="bold" />, title: 'À Connaître (Concours)' };
            case 'vigilance': return { icon: <Warning weight="bold" />, title: 'Point de Vigilance' };
            case 'expert': return { icon: <Brain weight="bold" />, title: 'Explication Expert' };
            default: return { icon: <Info weight="bold" />, title: 'Note' };
        }
    };

    const config = getTypeConfig(type);

    return (
        <NodeViewWrapper className={`medical-alert`} data-type={type}>
            <div className="medical-alert-header" contentEditable={false}>
                {config.icon}
                <span>{config.title}</span>
            </div>
            <NodeViewContent className="medical-alert-content" />
        </NodeViewWrapper>
    );
};

export const MedicalAlert = Node.create({
    name: 'medicalAlert',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'note',
            },
        };
    },

    parseHTML() {
        return [
            { 
                tag: 'div.medical-alert',
                getAttrs: element => ({
                    type: (element as HTMLElement).getAttribute('data-type') || 'note',
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ class: 'medical-alert' }, HTMLAttributes), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MedicalAlertComponent);
    },
});


// --- Editor Component ---

interface CourseEditorProps {
    value: string;
    onChange: (value: string) => void;
    existingCards?: Card[];
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ value, onChange, existingCards = [] }) => {
    const [showCardSelector, setShowCardSelector] = useState(false);
    const [cardSearch, setCardSearch] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);
    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-indigo max-w-3xl mx-auto focus:outline-none min-h-full'
            }
        },
        extensions: [
            StarterKit,
            Highlight.configure({ HTMLAttributes: { class: 'bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded' } }),
            Placeholder.configure({ placeholder: 'Commencez à rédiger votre cours...' }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Link.configure({ openOnClick: false }),
            Markdown,
            MedicalAlert,
            CardSuggestionPlugin.configure({
                suggestion: getSuggestionOptions(existingCards),
            }),
            ClozeExtension,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            // We save as Markdown by default to keep DB clean, 
            // but the medicalAlert node will serialize to raw HTML within the markdown, 
            // which react-markdown handles perfectly via rehype-raw!
            onChange((editor.storage as any).markdown.getMarkdown());
        },
    });

    // Update editor content when external value changes completely (e.g. switching cards)
    useEffect(() => {
        if (editor && !editor.isFocused) {
            const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
            if (value !== currentMarkdown) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    const setLink = useCallback(async () => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = await usePromptStore.getState().openPrompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addAlert = (type: string) => {
        editor?.chain().focus().insertContent({
            type: 'medicalAlert',
            attrs: { type },
            content: [{ type: 'paragraph' }]
        }).run();
    };

    const insertCardLink = (card: { id: string; title: string }) => {
        editor?.chain().focus().insertContent(`<a href="card://${card.id}">${card.title}</a> `).run();
        setShowCardSelector(false);
        setCardSearch('');
    };

    // Close selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(e.target as globalThis.Node)) {
                setShowCardSelector(false);
            }
        };
        if (showCardSelector) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCardSelector]);

    if (!editor) return null;

    const filteredCards = existingCards.filter(c => c.title.toLowerCase().includes(cardSearch.toLowerCase())).slice(0, 10);

    return (
        <div className="flex flex-col flex-1 h-full relative group">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-[#1E293B]/80 backdrop-blur-md border border-slate-700/80 shadow-lg mb-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('bold') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Gras (Cmd+B)">
                    <TextB size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('italic') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Italique">
                    <TextItalic size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('highlight') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Surligner">
                    <HighlighterCircle size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('cloze') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Texte à trou (Cmd+E)">
                    <EyeSlash size={16} />
                </button>
                
                <div className="w-px h-5 bg-slate-700 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors border-none outline-none cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Titre 1">
                    H1
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors border-none outline-none cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Titre 2">
                    H2
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors border-none outline-none cursor-pointer ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Titre 3">
                    H3
                </button>

                <div className="w-px h-5 bg-slate-700 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('bulletList') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Liste à puces">
                    <ListBullets size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('orderedList') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Liste numérotée">
                    <ListNumbers size={16} />
                </button>
                
                <div className="w-px h-5 bg-slate-700 mx-1" />
                
                <button type="button" onClick={setLink} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border-none outline-none cursor-pointer ${editor.isActive('link') ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} title="Lien">
                    <LinkIcon size={16} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-white border-none outline-none cursor-pointer" title="Insérer un tableau">
                    <TableIcon size={16} />
                </button>
                <button type="button" onClick={() => setShowCardSelector(!showCardSelector)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-white relative border-none outline-none cursor-pointer" title="Lier une carte existante">
                    <Cards size={16} />
                </button>

                <div className="w-px h-5 bg-slate-700 mx-1" />

                {/* Custom Alerts (Colored) */}
                <div className="flex items-center gap-1 ml-1 overflow-x-auto custom-scrollbar">
                    <button type="button" onClick={() => addAlert('definition')} className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 transition-colors border-none outline-none cursor-pointer" title="Définition">
                        <Info size={14} weight="bold" /> DÉF.
                    </button>
                    <button type="button" onClick={() => addAlert('concours')} className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-amber-400 hover:bg-amber-500/10 transition-colors border-none outline-none cursor-pointer" title="À connaître (Concours)">
                        <GraduationCap size={14} weight="bold" /> CONCOURS
                    </button>
                    <button type="button" onClick={() => addAlert('vigilance')} className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors border-none outline-none cursor-pointer" title="Vigilance">
                        <Warning size={14} weight="bold" /> VIGI.
                    </button>
                    <button type="button" onClick={() => addAlert('expert')} className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-slate-300 hover:bg-slate-700 transition-colors border-none outline-none cursor-pointer" title="Expert">
                        <Brain size={14} weight="bold" /> EXPERT
                    </button>
                </div>
            </div>
            
            
            {showCardSelector && (
                <div ref={selectorRef} className="absolute top-[70px] left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 z-50 shadow-md w-[300px] flex flex-col gap-2" >
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Rechercher une carte..." 
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded outline-none bg-transparent text-slate-900 dark:text-slate-100" 
                    />
                    <div className="max-h-[200px] overflow-y-auto flex flex-col custom-scrollbar" >
                        {filteredCards.length > 0 ? filteredCards.map(c => (
                            <button 
                                key={c.id} 
                                type="button" 
                                onClick={() => insertCardLink(c)}
                                className="px-2 py-1.5 text-left bg-transparent border-none rounded cursor-pointer text-sm text-slate-900 dark:text-slate-100 transition-colors" 
                                onMouseOver={(e) => e.currentTarget.classList.add('bg-slate-100', 'dark:bg-slate-800')}
                                onMouseOut={(e) => e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800')}
                                onFocus={(e) => e.currentTarget.classList.add('bg-slate-100', 'dark:bg-slate-800')}
                                onBlur={(e) => e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800')}
                            >
                                {c.title}
                            </button>
                        )) : <div className="p-2 text-sm text-slate-500 dark:text-slate-400 text-center" >Aucune carte trouvée</div>}
                    </div>
                </div>
            )}

            {editor && (
                <BubbleMenu editor={editor} className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 shadow-md dark:bg-[var(--color-surface)]">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`bg-transparent border-none rounded p-1.5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] ${editor.isActive('bold') ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} title="Gras">
                        <TextB size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`bg-transparent border-none rounded p-1.5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] ${editor.isActive('italic') ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} title="Italique">
                        <TextItalic size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`bg-transparent border-none rounded p-1.5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] ${editor.isActive('highlight') ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} title="Surligner">
                        <HighlighterCircle size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`bg-transparent border-none rounded p-1.5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] ${editor.isActive('cloze') ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} title="Texte à trou">
                        <EyeSlash size={18} />
                    </button>
                    <button type="button" onClick={setLink} className={`bg-transparent border-none rounded p-1.5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] ${editor.isActive('link') ? 'bg-[var(--color-border)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} title="Lien">
                        <LinkIcon size={18} />
                    </button>
                </BubbleMenu>
            )}

            {/* Editor Area */}
            <div className="flex-1 w-full bg-transparent overflow-y-auto custom-scrollbar relative pb-20">
                <EditorContent editor={editor} className="h-full prose prose-invert max-w-none text-slate-300 placeholder:text-slate-600" />
            </div>
        </div>
    );
};
