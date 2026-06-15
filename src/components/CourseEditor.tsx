// @ts-nocheck
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
    TextB, TextItalic, ListBullets, ListNumbers, 
    TextHOne, TextHTwo, TextHThree, HighlighterCircle, 
    Table as TableIcon, Link as LinkIcon, Info, Warning, GraduationCap, Brain, Cards, EyeSlash
} from '@phosphor-icons/react';
import { ClozeExtension } from './editor/ClozeExtension';
import './CourseEditor.css';

// --- Custom Node for Medical Alerts ---

const MedicalAlertComponent = ({ node }: { node: { attrs: { type: string } } }) => {
    const type = node.attrs.type;
    
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
                default: 'definition',
            },
        };
    },

    parseHTML() {
        return [
            { tag: 'div.medical-alert' },
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
    existingCards?: { id: string; title: string; type: string }[];
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ value, onChange, existingCards = [] }) => {
    const [showCardSelector, setShowCardSelector] = useState(false);
    const [cardSearch, setCardSearch] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight.configure({ HTMLAttributes: { class: 'bg-yellow-200 px-1 rounded' } }),
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
        if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
             // Avoid resetting cursor position
             const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
             if (value !== currentMarkdown) {
                 editor.commands.setContent(value);
             }
        }
    }, [value, editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    const addAlert = (type: string) => {
        editor.chain().focus().insertContent({
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

    const filteredCards = existingCards.filter(c => c.title.toLowerCase().includes(cardSearch.toLowerCase())).slice(0, 10);

    return (
        <div className="course-editor-wrapper" style={{ position: 'relative' }}>
            <div className="course-editor-toolbar">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Gras">
                    <TextB size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italique">
                    <TextItalic size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`} title="Surligner">
                    <HighlighterCircle size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`toolbar-btn ${editor.isActive('cloze') ? 'is-active' : ''}`} title="Texte à trou (Cmd+E)">
                    <EyeSlash size={18} />
                </button>
                
                <div className="toolbar-divider" />

                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`} title="Titre 1">
                    <TextHOne size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`} title="Titre 2">
                    <TextHTwo size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`} title="Titre 3">
                    <TextHThree size={18} />
                </button>

                <div className="toolbar-divider" />

                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`} title="Liste à puces">
                    <ListBullets size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`} title="Liste numérotée">
                    <ListNumbers size={18} />
                </button>
                
                <div className="toolbar-divider" />
                
                <button type="button" onClick={setLink} className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`} title="Lien">
                    <LinkIcon size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="toolbar-btn" title="Insérer un tableau">
                    <TableIcon size={18} />
                </button>
                <button type="button" onClick={() => setShowCardSelector(!showCardSelector)} className="toolbar-btn" title="Lier une carte existante" style={{ position: 'relative' }}>
                    <Cards size={18} />
                </button>

                <div className="toolbar-divider" />

                {/* Blocs Médicaux Spécifiques */}
                <button type="button" onClick={() => addAlert('definition')} className="toolbar-btn" style={{ color: '#2563eb' }} title="Définition">
                    <Info size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Déf.</span>
                </button>
                <button type="button" onClick={() => addAlert('concours')} className="toolbar-btn" style={{ color: 'var(--color-warning)' }} title="À connaître (Concours)">
                    <GraduationCap size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Concours</span>
                </button>
                <button type="button" onClick={() => addAlert('vigilance')} className="toolbar-btn" style={{ color: 'var(--color-danger)' }} title="Vigilance">
                    <Warning size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Vigi.</span>
                </button>
                <button type="button" onClick={() => addAlert('expert')} className="toolbar-btn" style={{ color: 'var(--color-text)' }} title="Expert">
                    <Brain size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Expert</span>
                </button>
            </div>
            
            
            {showCardSelector && (
                <div ref={selectorRef} className="card-selector-popup" style={{
                    position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--color-surface)', border: '1px solid #e2e8f0', borderRadius: '8px', 
                    padding: '8px', zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    width: '300px', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Rechercher une carte..." 
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {filteredCards.length > 0 ? filteredCards.map(c => (
                            <button 
                                key={c.id} 
                                type="button" 
                                onClick={() => insertCardLink(c)}
                                style={{ padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                {c.title}
                            </button>
                        )) : <div style={{ padding: '8px', fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'center' }}>Aucune carte trouvée</div>}
                    </div>
                </div>
            )}

            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="course-editor-toolbar bubble-menu">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Gras">
                        <TextB size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italique">
                        <TextItalic size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`} title="Surligner">
                        <HighlighterCircle size={18} />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`toolbar-btn ${editor.isActive('cloze') ? 'is-active' : ''}`} title="Texte à trou">
                        <EyeSlash size={18} />
                    </button>
                    <button type="button" onClick={setLink} className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`} title="Lien">
                        <LinkIcon size={18} />
                    </button>
                </BubbleMenu>
            )}

            <div className="course-editor-content">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
