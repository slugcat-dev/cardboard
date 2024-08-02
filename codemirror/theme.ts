import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { markTag, underlineItalicTag, underlineTag } from './customTags'

const chalky = '#e5c07b'
const coral = '#e06c75'
const cyan = '#56b6c2'
const invalid = '#ffffff'
const ivory = '#abb2bf'
const stone = '#7d8799'
const malibu = '#61afef'
const sage = '#98c379'
const whiskey = '#d19a66'
const violet = '#c678dd'

const highlightStyle = HighlightStyle.define([
	{ tag: markTag, class: 'cm-markdown-mark' },
	{ tag: [t.heading, t.strong], fontWeight: 'bold' },
	{ tag: t.emphasis, class: 'cm-markdown-italic' },
	{ tag: underlineTag, class: 'cm-markdown-underline' },
	{ tag: underlineItalicTag, class: 'cm-markdown-underline cm-markdown-italic' },
	{ tag: t.strikethrough, class: 'cm-markdown-strikethrough' },

	{ tag: t.keyword, color: violet },
	{ tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
	{ tag: [t.function(t.variableName), t.labelName], color: malibu },
	{ tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
	{ tag: [t.definition(t.name), t.separator], color: ivory },
	{ tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: chalky },
	{ tag: [t.operator, t.operatorKeyword, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
	{ tag: [t.meta, t.comment], color: stone },
	{ tag: t.link, color: stone, textDecoration: 'underline' },
	{ tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
	{ tag: [t.processingInstruction, t.string, t.inserted], color: sage },
	{ tag: t.invalid, color: invalid }
])

const editorTheme = EditorView.theme({
	'&.cm-focused': { outline: 'none' },
	'.cm-scroller': {
		overflow: 'initial',
		fontFamily: 'Roboto, system-ui, sans-serif !important',
		lineHeight: '1.25rem'
	},
	'.cm-content': { padding: 0 },
	'.cm-line': { padding: 0 },
	'.cm-cursor, .cm-dropCursor': {
		width: '2px',
		marginLeft: '-1px',
		backgroundColor: 'currentcolor',
		border: 'none',
		transition: 'all 50ms'
	},
	'.cm-markdown-hidden': { display: 'none' },
	'.cm-markdown-mark': { color: 'color-mix(in srgb, currentcolor, transparent 50%)' },
	'.cm-markdown-italic': { fontStyle: 'italic' },
	'.cm-markdown-underline': { textDecoration: 'underline' },
	'.cm-markdown-strikethrough': { textDecoration: 'line-through' },
	'.cm-markdown-strikethrough.cm-markdown-underline': { textDecoration: 'line-through underline' },
	'.cm-markdown-highlight': { color: 'var(--color-warn)', fontWeight: 'bold' }
}, { dark: true })

export default [editorTheme, syntaxHighlighting(highlightStyle)]
