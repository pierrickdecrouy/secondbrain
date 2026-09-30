import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import { 
  TextB, TextItalic, TextUnderline, EyeSlash, 
  ListBullets, ListNumbers, Link as LinkIcon
} from '@phosphor-icons/react';
import { ClozeExtension } from './ClozeExtension';
import { usePromptStore } from '../../store/usePromptStore';

interface TipTapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

import type { Editor } from '@tiptap/react';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="sticky top-4 z-20 flex justify-center mb-6 pointer-events-none transition-all duration-300">
            <div className="flex flex-wrap items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl px-2 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] text-slate-600 dark:text-slate-300 pointer-events-auto">
                
                {/* Style basique */}
                <div className="flex items-center space-x-1 border-r border-slate-200/50 dark:border-slate-800/50 pr-2 mr-2">
                    <button 
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                        title="Gras (Cmd+B)"
                    >
                        <TextB size={16} />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                        title="Italique (Cmd+I)"
                    >
                        <TextItalic size={16} />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        disabled={!editor.can().chain().focus().toggleUnderline().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                        title="Souligné (Cmd+U)"
                    >
                        <TextUnderline size={16} />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleCloze().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('cloze') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                        title="Texte à trous (Cloze)"
                    >
                        <EyeSlash size={16} />
                    </button>
                </div>

                {/* Titres */}
                <div className="flex items-center space-x-1 border-r border-slate-200/50 dark:border-slate-800/50 pr-2 mr-2 text-sm font-bold">
                    <button 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        H1
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        H2
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        H3
                    </button>
                </div>

                {/* Listes & Medias */}
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        <ListBullets size={16} />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        <ListNumbers size={16} />
                    </button>
                    <button 
                        onClick={async () => {
                            const previousUrl = editor.getAttributes('link').href;
                            const url = await usePromptStore.getState().openPrompt('URL', previousUrl);
                            if (url === null) return;
                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }}
                        className={`p-1.5 rounded-lg transition-all ${editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-800 dark:hover:text-white'}`}
                    >
                        <LinkIcon size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ value, onChange, placeholder = "Commencez à écrire ici..." }) => {
    
    const lastValueRef = useRef(value);

    const extensions = React.useMemo(() => [
        StarterKit,
        Underline,
        Link.configure({
            openOnClick: false,
        }),
        Placeholder.configure({
            placeholder,
            emptyEditorClass: 'is-editor-empty',
        }),
        ClozeExtension,
        Markdown.configure({
            html: false,
            tightLists: true,
            tightListClass: 'tight',
            bulletListMarker: '-',
            linkify: true,
            breaks: true,
        }),
    ], [placeholder]);

    const editor = useEditor({
        extensions,
        content: value,
        onUpdate: ({ editor }) => {
            // Retrieve markdown
            const markdown = (editor.storage as any).markdown.getMarkdown();
            lastValueRef.current = markdown;
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-slate prose-lg max-w-none focus:outline-none min-h-[300px]',
            },
        },
    });

    // Handle incoming value changes (e.g. if cleared from outside)
    useEffect(() => {
        if (editor && value !== lastValueRef.current) {
            lastValueRef.current = value;
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className="flex-1 w-full flex flex-col tiptap-wrapper">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="flex-1 w-full cursor-text" onClick={() => editor?.commands.focus()} />
        </div>
    );
};
