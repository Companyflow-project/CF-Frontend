import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    isEditable?: boolean;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    isEditable = true,
    className = '',
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#3d997d] underline cursor-pointer',
                },
            }),
        ],
        content,
        editable: isEditable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-bold prose-h2:mt-4 prose-h2:mb-2 prose-p:my-2',
            },
        },
    });

    React.useEffect(() => {
        if (editor && content !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    React.useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
        }
    }, [isEditable, editor]);

    if (!editor) {
        return null;
    }

    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        icon: React.ReactNode;
        title: string;
    }> = ({ onClick, isActive, icon, title }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-[6px] transition-colors ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white hover:bg-white/10'
                }`}
        >
            {icon}
        </button>
    );

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className={className}>
            {isEditable && (
                <div className="bg-[#1a5948] rounded-t-[10px] p-2 flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<Bold className="h-4 w-4" />}
                        title="Bold"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<Italic className="h-4 w-4" />}
                        title="Italic"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={<UnderlineIcon className="h-4 w-4" />}
                        title="Underline"
                    />

                    <div className="w-px h-5 bg-white/20 mx-1" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={<span className="font-bold text-xs">H2</span>}
                        title="Heading 2"
                    />

                    <div className="w-px h-5 bg-white/20 mx-1" />

                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<List className="h-4 w-4" />}
                        title="Bullet List"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={<ListOrdered className="h-4 w-4" />}
                        title="Ordered List"
                    />

                    <div className="w-px h-5 bg-white/20 mx-1" />

                    <ToolbarButton
                        onClick={addLink}
                        isActive={editor.isActive('link')}
                        icon={<LinkIcon className="h-4 w-4" />}
                        title="Add Link"
                    />
                </div>
            )}

            <EditorContent
                editor={editor}
                className={`${isEditable
                    ? 'rounded-b-[10px] rounded-t-none border border-t-0 border-[#c8d8d3]'
                    : 'border border-[#c8d8d3] rounded-[10px]'
                    } bg-white`}
            />
        </div>
    );
};
