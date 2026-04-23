import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  if (!editor) return null

  const setLink = () => {
    const url = prompt('URL du lien :')
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Gras' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Italique' },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: 'Liste' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: 'Liste numérotée' },
    { icon: LinkIcon, action: setLink, active: editor.isActive('link'), label: 'Lien' },
  ]

  return (
    <div className="border border-gray-200 rounded-btn overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
        {tools.map(({ icon: Icon, action, active, label }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            title={label}
            className={cn(
              'p-2 rounded-lg transition-colors min-h-touch min-w-[40px] flex items-center justify-center',
              active ? 'bg-violet text-white' : 'text-gray-500 hover:bg-gray-200'
            )}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[150px] text-navy focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[120px]"
      />
    </div>
  )
}
