// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Markdown } from 'tiptap-markdown';
import { 
    TextB, TextItalic, TextUnderline, TextAlignLeft, TextAlignCenter, TextAlignRight,
    ListBullets, ListNumbers, TextHOne, TextHTwo, TextHThree, HighlighterCircle, 
    Table as TableIcon, Link as LinkIcon, Image as ImageIcon,
    Info, Warning, GraduationCap, Brain, Cards, ArrowLeft, FloppyDisk, Plus, X, CornersOut, CornersIn, EyeSlash
} from '@phosphor-icons/react';
import type { Card } from '../types';
import { MedicalAlert } from './CourseEditor'; // Reusing the same node!
import { ClozeExtension } from './editor/ClozeExtension';
import { CardSuggestionPlugin } from './editor/CardSuggestionPlugin';
import { getSuggestionOptions } from './editor/suggestionConfig';

interface FullCourseEditorProps {
    course: Card;
    onSave: (course: Card) => void;
    onCancel: () => void;
    existingCards: Card[];
    onPause?: (draftCourse: Card) => void;
}

export const FullCourseEditor: React.FC<FullCourseEditorProps> = ({
    course,
    onSave,
    onCancel,
    existingCards,
    onPause
}) => {
    const [title, setTitle] = useState(course.title);
    const [subject, setSubject] = useState(course.subject || '');
    const [tags, setTags] = useState<string[]>(course.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [showCardSelector, setShowCardSelector] = useState(false);
    const [cardSearch, setCardSearch] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);
    const isExplicitlyClosedRef = useRef(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-indigo max-w-none focus:outline-none min-h-full'
            }
        },
        extensions: [
            StarterKit,
            Highlight.configure({ HTMLAttributes: { class: 'bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded' } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: true, allowBase64: true }),
            TextStyle,
            Color,
            Placeholder.configure({ placeholder: 'Rédigez le contenu de votre cours ici...' }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Link.configure({ openOnClick: false }),
            Markdown,
            MedicalAlert, // Same medical blocks
            CardSuggestionPlugin.configure({
                suggestion: getSuggestionOptions(existingCards),
            }),
            ClozeExtension,
        ],
        content: course.details || course.content || '',
    });

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

    const addImage = useCallback(() => {
        const url = window.prompt('URL de l\'image');
        if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleSave = useCallback(() => {
        if (!editor) return;
        
        // Extract Markdown
        const contentMarkdown = (editor.storage as any).markdown.getMarkdown();
        
        // Extract a plain text summary for 'content'
        const plainText = editor.getText();
        const snippet = plainText.substring(0, 300) + (plainText.length > 300 ? '...' : '');

        onSave({
            ...course,
            title,
            subject,
            tags,
            content: snippet,
            details: contentMarkdown,
        });
    }, [editor, course, title, subject, tags, onSave]);

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const addAlert = (type: string) => {
        editor?.chain().focus().insertContent({
            type: 'medicalAlert',
            attrs: { type },
            content: [{ type: 'paragraph' }]
        }).run();
    };

    const handleSaveRef = useRef(handleSave);
    useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    // Auto-save logic
    useEffect(() => {
        // Debounced auto-save directly to onSave
        const timeout = setTimeout(() => {
            if (!isExplicitlyClosedRef.current) {
                handleSaveRef.current();
            }
        }, 1500);
        return () => clearTimeout(timeout);
    }, [handleSave]);

    // Unmount auto-save
    useEffect(() => {
        return () => {
            if (!isExplicitlyClosedRef.current) {
                handleSaveRef.current();
            }
        };
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            editorContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleFullscreen]);

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

    if (!editor) return <div style={{padding: '50px', color: 'red'}}>Chargement de l'éditeur... (si ce message reste, c'est que l'éditeur a planté)</div>;

    return (
        <div ref={editorContainerRef} className="full-course-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: isFullscreen ? 'var(--color-surface)' : 'var(--color-bg)', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Course Meta (Title, Tags) */}
                    <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <button onClick={() => {
                                isExplicitlyClosedRef.current = true;
                                handleSave(); // Save one last time before leaving
                                onCancel();
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', marginLeft: '-12px' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                <ArrowLeft size={18} weight="bold" />
                                Retour
                            </button>

                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                (Sauvegarde auto activée)
                            </span>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={toggleFullscreen} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600, padding: '6px 12px', borderRadius: '8px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                                title="Mode Focus (Cmd+Shift+F)"
                                >
                                    {isFullscreen ? <CornersIn size={18} weight="bold" /> : <CornersOut size={18} weight="bold" />}
                                    <span style={{ display: isFullscreen ? 'none' : 'inline' }}>Focus</span>
                                </button>
                                <button onClick={() => {
                                    handleSave();
                                }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', marginRight: '-12px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                                >
                                    <FloppyDisk size={18} weight="bold" />
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                        
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre du cours..."
                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '16px', backgroundColor: 'transparent' }}
                        />
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: '1 1 300px', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Tags:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                    {tags.map(tag => (
                                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-bg)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                            #{tag}
                                            <X size={12} weight="bold" style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => removeTag(tag)} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'} />
                                        </span>
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <Plus size={14} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={addTag} />
                                        <input 
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            placeholder="Nouveau tag..."
                                            style={{ border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--color-text)', backgroundColor: 'transparent', width: '100px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="course-editor-toolbar" style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', backgroundColor: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 5 }}>
                        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Gras">
                            <TextB size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italique">
                            <TextItalic size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`} title="Souligné">
                            <TextUnderline size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`} title="Surligner">
                            <HighlighterCircle size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`toolbar-btn ${editor.isActive('cloze') ? 'is-active' : ''}`} title="Texte à trou (Cmd+E)">
                            <EyeSlash size={18} />
                        </button>
                        <input 
                            type="color" 
                            onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                            value={editor.getAttributes('textStyle').color || 'var(--color-text)'}
                            style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '4px' }}
                            title="Couleur du texte"
                        />
                        
                        <div className="toolbar-divider" />

                        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`} title="Aligner à gauche">
                            <TextAlignLeft size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`} title="Centrer">
                            <TextAlignCenter size={18} />
                        </button>
                        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`} title="Aligner à droite">
                            <TextAlignRight size={18} />
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
                        <button type="button" onClick={addImage} className="toolbar-btn" title="Image">
                            <ImageIcon size={18} />
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
                        <button type="button" onClick={() => addAlert('concours')} className="toolbar-btn" style={{ color: '#d97706' }} title="À connaître (Concours)">
                            <GraduationCap size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Concours</span>
                        </button>
                        <button type="button" onClick={() => addAlert('vigilance')} className="toolbar-btn" style={{ color: '#dc2626' }} title="Vigilance">
                            <Warning size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Vigi.</span>
                        </button>
                        <button type="button" onClick={() => addAlert('expert')} className="toolbar-btn" style={{ color: 'var(--color-text)' }} title="Expert">
                            <Brain size={18} weight="bold" /> <span style={{fontSize: 12, marginLeft: 4, fontWeight: 600}}>Expert</span>
                        </button>
                    </div>

                    {showCardSelector && (
                        <div ref={selectorRef} className="card-selector-popup" style={{
                            position: 'absolute', top: '230px', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', 
                            padding: '8px', zIndex: 50, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            width: '300px', display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Rechercher une carte..." 
                                value={cardSearch}
                                onChange={(e) => setCardSearch(e.target.value)}
                                style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                            />
                            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                {filteredCards.length > 0 ? filteredCards.map(c => (
                                    <button 
                                        key={c.id} 
                                        type="button" 
                                        onClick={() => insertCardLink(c)}
                                        style={{ padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text)' }}
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
                        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="course-editor-toolbar bubble-menu" style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Gras">
                                <TextB size={18} />
                            </button>
                            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italique">
                                <TextItalic size={18} />
                            </button>
                            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`} title="Souligné">
                                <TextUnderline size={18} />
                            </button>
                            <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`} title="Surligner">
                                <HighlighterCircle size={18} />
                            </button>
                            <button type="button" onClick={() => editor.chain().focus().toggleCloze().run()} className={`toolbar-btn ${editor.isActive('cloze') ? 'is-active' : ''}`} title="Texte à trou (Cmd+E)">
                                <EyeSlash size={18} />
                            </button>
                            <button type="button" onClick={setLink} className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`} title="Lien">
                                <LinkIcon size={18} />
                            </button>
                        </BubbleMenu>
                    )}

                    {/* Editor Content Area */}
                    <div className="course-editor-content" style={{ padding: '16px 48px 64px 48px', flex: 1, overflowY: 'visible', minHeight: '500px' }}>
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    );
};
