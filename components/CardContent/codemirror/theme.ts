import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { markTag, underlineItalicTag, underlineTag } from './customTags'

const highlightStyle = HighlightStyle.define([
	{ tag: markTag, opacity: .5 },
	{ tag: t.heading1, fontSize: '1.25rem', fontWeight: 'bold' },
	{ tag: [t.heading, t.strong], fontWeight: 'bold' },
	{ tag: [t.emphasis, underlineItalicTag], fontStyle: 'italic' },
	{ tag: [underlineTag, underlineItalicTag], class: 'cm-markdown-underline' },
	{ tag: t.strikethrough, class: 'cm-markdown-strikethrough' }
])

const editorTheme = EditorView.theme({
	'.cm-markdown-hidden': { display: 'none' },
	'.cm-markdown-underline': { textDecoration: 'underline' },
	'.cm-markdown-strikethrough': { textDecoration: 'line-through' },
	'.cm-markdown-strikethrough.cm-markdown-underline': { textDecoration: 'line-through underline' },
	'.cm-markdown-task-marker': { fontFamily: 'monospace' },
	'.cm-markdown-checkbox': {
		position: 'relative',
		top: '1px',
		marginInlineEnd: '.25rem'
	},
	'.cm-markdown-checkbox > input': {
		display: 'inline-block',
		width: '.75rem',
		height: '.75rem',
		margin: 0
	}
}, { dark: true })

export default [editorTheme, syntaxHighlighting(highlightStyle)]
