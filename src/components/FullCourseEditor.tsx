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
import './styles/FullCourseEditor.css';

interface FullCourseEditorProps {
    course: Card;
    onSave: (course: Card) => void;
    onCancel: () => void;
    existingCards: Card[];
}

export const FullCourseEditor: React.FC<FullCourseEditorProps> = ({
    course,
    onSave,
    onCancel,
    existingCards
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

    if (!editor) return <div className="fullcourseeditor-style-1" >Chargement de l'éditeur... (si ce message reste, c'est que l'éditeur a planté)</div>;

    return (
        <div ref={editorContainerRef} className="full-course-editor fullcourseeditor-style-2" style={{
  backgroundColor: isFullscreen ? 'var(--color-surface)' : 'var(--color-bg)'
}}>
            <div className="fullcourseeditor-style-3" >
                <div className="fullcourseeditor-style-4" >
                    
                    {/* Course Meta (Title, Tags) */}
                    <div className="fullcourseeditor-style-5" >
                        <div className="fullcourseeditor-style-6" >
                            <button onClick={() => {
                                isExplicitlyClosedRef.current = true;
                                handleSave(); // Save one last time before leaving
                                onCancel();
                            }} className="fullcourseeditor-style-7" 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                <ArrowLeft size={18} weight="bold" />
                                Retour
                            </button>

                            <span className="fullcourseeditor-style-8" >
                                (Sauvegarde auto activée)
                            </span>

                            <div className="fullcourseeditor-style-9" >
                                <button onClick={toggleFullscreen} className="fullcourseeditor-style-10" 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                                title="Mode Focus (Cmd+Shift+F)"
                                >
                                    {isFullscreen ? <CornersIn size={18} weight="bold" /> : <CornersOut size={18} weight="bold" />}
                                    <span style={{ display: isFullscreen ? 'none' : 'inline' }}>Focus</span>
                                </button>
                                <button onClick={() => {
                                    handleSave();
                                }} className="fullcourseeditor-style-11" 
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
                            className="fullcourseeditor-style-12" 
                        />
                        <div className="fullcourseeditor-style-13" >
                            <div className="fullcourseeditor-style-14" >
                                <span className="fullcourseeditor-style-15" >Matière:</span>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ex: Cardiologie..."
                                    className="fullcourseeditor-style-16" 
                                />
                            </div>
                            <div className="fullcourseeditor-style-17" >
                                <span className="fullcourseeditor-style-18" >Tags:</span>
                                <div className="fullcourseeditor-style-19" >
                                    {tags.map(tag => (
                                        <span key={tag} className="fullcourseeditor-style-20" >
                                            #{tag}
                                            <X size={12} weight="bold" className="fullcourseeditor-style-21"  onClick={() => removeTag(tag)} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'} />
                                        </span>
                                    ))}
                                    <div className="fullcourseeditor-style-22" >
                                        <Plus size={14} className="fullcourseeditor-style-23"  onClick={addTag} />
                                        <input 
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            placeholder="Nouveau tag..."
                                            className="fullcourseeditor-style-24" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="course-editor-toolbar fullcourseeditor-style-25" >
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
                            className="fullcourseeditor-style-26" 
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
                        <button type="button" onClick={() => setShowCardSelector(!showCardSelector)} className="toolbar-btn fullcourseeditor-style-27" title="Lier une carte existante" >
                            <Cards size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Blocs Médicaux Spécifiques */}
                        <button type="button" onClick={() => addAlert('definition')} className="toolbar-btn fullcourseeditor-style-28"  title="Définition">
                            <Info size={18} weight="bold" /> <span className="fullcourseeditor-style-29" >Déf.</span>
                        </button>
                        <button type="button" onClick={() => addAlert('concours')} className="toolbar-btn fullcourseeditor-style-30"  title="À connaître (Concours)">
                            <GraduationCap size={18} weight="bold" /> <span className="fullcourseeditor-style-31" >Concours</span>
                        </button>
                        <button type="button" onClick={() => addAlert('vigilance')} className="toolbar-btn fullcourseeditor-style-32"  title="Vigilance">
                            <Warning size={18} weight="bold" /> <span className="fullcourseeditor-style-33" >Vigi.</span>
                        </button>
                        <button type="button" onClick={() => addAlert('expert')} className="toolbar-btn fullcourseeditor-style-34"  title="Expert">
                            <Brain size={18} weight="bold" /> <span className="fullcourseeditor-style-35" >Expert</span>
                        </button>
                    </div>

                    {showCardSelector && (
                        <div ref={selectorRef} className="card-selector-popup fullcourseeditor-style-36" >
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Rechercher une carte..." 
                                value={cardSearch}
                                onChange={(e) => setCardSearch(e.target.value)}
                                className="fullcourseeditor-style-37" 
                            />
                            <div className="fullcourseeditor-style-38" >
                                {filteredCards.length > 0 ? filteredCards.map(c => (
                                    <button 
                                        key={c.id} 
                                        type="button" 
                                        onClick={() => insertCardLink(c)}
                                        className="fullcourseeditor-style-39" 
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        onFocus={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                        onBlur={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {c.title}
                                    </button>
                                )) : <div className="fullcourseeditor-style-40" >Aucune carte trouvée</div>}
                            </div>
                        </div>
                    )}

                    {editor && (
                        <BubbleMenu editor={editor} className="course-editor-toolbar bubble-menu fullcourseeditor-style-41" >
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
                    <div className="course-editor-content fullcourseeditor-style-42" >
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    );
};
