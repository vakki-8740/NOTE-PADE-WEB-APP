import IconButton from '../ui/IconButton.jsx'
import './EditorToolbar.css'

function Sep() {
  return <span className="sep" />
}

export default function EditorToolbar({ editor, onRequestLink }) {
  if (!editor) return null

  const is = (name, attrs) => editor.isActive(name, attrs)

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
      <IconButton
        icon="undo"
        label="Undo"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <IconButton
        icon="redo"
        label="Redo"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />
      <Sep />
      <IconButton
        icon="heading"
        label="Heading 1"
        size="sm"
        active={is('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <IconButton
        icon="heading"
        label="Heading 2"
        size="sm"
        active={is('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Sep />
      <IconButton
        icon="bold"
        label="Bold"
        size="sm"
        active={is('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <IconButton
        icon="italic"
        label="Italic"
        size="sm"
        active={is('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <IconButton
        icon="underline"
        label="Underline"
        size="sm"
        active={is('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <IconButton
        icon="strikethrough"
        label="Strikethrough"
        size="sm"
        active={is('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Sep />
      <IconButton
        icon="list"
        label="Bullet list"
        size="sm"
        active={is('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <IconButton
        icon="list-ordered"
        label="Numbered list"
        size="sm"
        active={is('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <IconButton
        icon="list-checks"
        label="Checklist"
        size="sm"
        active={is('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <Sep />
      <IconButton
        icon="quote"
        label="Quote"
        size="sm"
        active={is('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <IconButton
        icon="code"
        label="Code block"
        size="sm"
        active={is('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <IconButton icon="link" label="Insert link" size="sm" active={is('link')} onClick={onRequestLink} />
      <IconButton
        icon="table"
        label="Insert table"
        size="sm"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
    </div>
  )
}
