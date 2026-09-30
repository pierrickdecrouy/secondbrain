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
import { usePromptStore } from '../store/usePromptStore';
import { CardSuggestionPlugin } from './editor/CardSuggestionPlugin';
import { getSuggestionOptions } from './editor/suggestionConfig';

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

    const extensions = React.useMemo(() => [
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
    ], [existingCards]);

    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-indigo max-w-none focus:outline-none min-h-full'
            }
        },
        extensions,
        content: course.details || course.content || '',
    });

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

    const addImage = useCallback(async () => {
        const url = await usePromptStore.getState().openPrompt('URL de l\'image');
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

    if (!editor) return <div className="p-12 text-red-500" >Chargement de l'éditeur... (si ce message reste, c'est que l'éditeur a planté)</div>;

    return (
        <div ref={editorContainerRef} className={`full-course-editor flex flex-col h-full overflow-hidden ${isFullscreen ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}`}>
            <div className="flex-1 overflow-y-auto px-4 py-8 flex justify-center" >
                <div className="w-full max-w-[1200px] bg-white dark:bg-slate-900 rounded-xl shadow-md flex flex-col" >
                    
                    {/* Course Meta (Title, Tags) */}
                    <div className="p-6 pb-4 border-b border-slate-50 dark:border-slate-950" >
                        <div className="flex items-center justify-between mb-6" >
                            <button onClick={() => {
                                isExplicitlyClosedRef.current = true;
                                handleSave(); // Save one last time before leaving
                                onCancel();
                            }} className="inline-flex items-center gap-2 bg-transparent border-none text-slate-500 font-semibold px-3 py-1.5 rounded-lg -ml-3 cursor-pointer transition-colors duration-150" 
                            
                            
                            >
                                <ArrowLeft size={18} weight="bold" />
                                Retour
                            </button>

                            <span className="text-xs text-slate-500" >
                                (Sauvegarde auto activée)
                            </span>

                            <div className="flex gap-2" >
                                <button onClick={toggleFullscreen} className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-150" 
                                
                                
                                title="Mode Focus (Cmd+Shift+F)"
                                >
                                    {isFullscreen ? <CornersIn size={18} weight="bold" /> : <CornersOut size={18} weight="bold" />}
                                    <span className={isFullscreen ? 'hidden' : 'inline'}>Focus</span>
                                </button>
                                <button onClick={() => {
                                    handleSave();
                                }} className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 -mr-3" 
                                
                                
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
                            className="w-full border-none outline-none text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 bg-transparent" 
                        />
                        <div className="flex gap-4 flex-wrap" >
                            <div className="flex items-center gap-2 flex-1 basis-[250px]" >
                                <span className="color-slate-500 text-sm font-medium" >Matière:</span>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ex: Cardiologie..."
                                    className="flex-1 min-w-[150px] border-none outline-none text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-md" 
                                />
                            </div>
                            <div className="flex items-start gap-2 flex-1 basis-[300px] flex-col" >
                                <span className="color-slate-500 text-sm font-medium" >Tags:</span>
                                <div className="flex flex-wrap gap-1.5 items-center" >
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-full text-[0.85rem] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700" >
                                            #{tag}
                                            <X size={12} weight="bold" className="cursor-pointer text-slate-500 hover:text-red-500 transition-colors"  onClick={() => removeTag(tag)}   />
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700" >
                                        <Plus size={14} className="cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"  onClick={addTag} />
                                        <input 
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            placeholder="Nouveau tag..."
                                            className="border-none outline-none text-[0.85rem] text-slate-900 dark:text-slate-100 bg-transparent w-[100px]" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="course-editor-toolbar px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap bg-white dark:bg-slate-900 sticky top-0 z-10" >
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
                            className="w-7 h-7 p-0 border-none rounded cursor-pointer ml-1" 
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
                        <button type="button" onClick={() => setShowCardSelector(!showCardSelector)} className="toolbar-btn relative" title="Lier une carte existante" >
                            <Cards size={18} />
                        </button>

                        <div className="toolbar-divider" />

                        {/* Blocs Médicaux Spécifiques */}
                        <button type="button" onClick={() => addAlert('definition')} className="toolbar-btn text-blue-600 dark:text-blue-500"  title="Définition">
                            <Info size={18} weight="bold" /> <span className="text-xs ml-1 font-semibold" >Déf.</span>
                        </button>
                        <button type="button" onClick={() => addAlert('concours')} className="toolbar-btn text-amber-600 dark:text-amber-500"  title="À connaître (Concours)">
                            <GraduationCap size={18} weight="bold" /> <span className="text-xs ml-1 font-semibold" >Concours</span>
                        </button>
                        <button type="button" onClick={() => addAlert('vigilance')} className="toolbar-btn text-red-600 dark:text-red-500"  title="Vigilance">
                            <Warning size={18} weight="bold" /> <span className="text-xs ml-1 font-semibold" >Vigi.</span>
                        </button>
                        <button type="button" onClick={() => addAlert('expert')} className="toolbar-btn text-slate-900 dark:text-slate-100"  title="Expert">
                            <Brain size={18} weight="bold" /> <span className="text-xs ml-1 font-semibold" >Expert</span>
                        </button>
                    </div>

                    {showCardSelector && (
                        <div ref={selectorRef} className="card-selector-popup absolute top-[230px] left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 z-50 shadow-md w-[300px] flex flex-col gap-2" >
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Rechercher une carte..." 
                                value={cardSearch}
                                onChange={(e) => setCardSearch(e.target.value)}
                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded outline-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" 
                            />
                            <div className="max-h-[200px] overflow-y-auto flex flex-col" >
                                {filteredCards.length > 0 ? filteredCards.map(c => (
                                    <button 
                                        key={c.id} 
                                        type="button" 
                                        onClick={() => insertCardLink(c)}
                                        className="px-2 py-1.5 text-left bg-transparent border-none rounded cursor-pointer text-sm text-slate-900 dark:text-slate-100 transition-colors" 
                                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        onFocus={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                        onBlur={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {c.title}
                                    </button>
                                )) : <div className="p-2 text-sm text-slate-500 text-center" >Aucune carte trouvée</div>}
                            </div>
                        </div>
                    )}

                    {editor && (
                        <BubbleMenu editor={editor} className="course-editor-toolbar bubble-menu p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-md" >
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
                    <div className="course-editor-content px-12 py-4 pb-16 flex-1 overflow-visible min-h-[500px]" >
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    );
};
