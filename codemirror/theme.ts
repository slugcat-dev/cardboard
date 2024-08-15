import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { markTag, underlineTag } from './customTags'

const highlightStyle = HighlightStyle.define([
	{ tag: markTag, class: 'cm-markdown-mark' },
	{ tag: [t.heading, t.strong], fontWeight: 'bold' },
	{ tag: t.emphasis, class: 'cm-markdown-italic' },
	{ tag: underlineTag, class: 'cm-markdown-underline' },
	{ tag: t.strikethrough, class: 'cm-markdown-strikethrough' },

	{
		tag: [
			t.keyword,
			t.operatorKeyword,
			t.modifier,
			t.color,
			t.constant(t.name),
			t.standard(t.name),
			t.standard(t.tagName),
			t.special(t.brace),
			t.special(t.variableName),
			t.controlKeyword,
			t.moduleKeyword,
			t.operator,
			t.contentSeparator,
			t.escape,
			t.processingInstruction
		],
		color: '#fe838f'
	},
	{
		tag: [
			t.name,
			t.deleted,
			t.character,
			t.macroName,
			t.labelName,
			t.definition(t.name),
			t.derefOperator
		],
		color: 'var(--color-text)'
	},
	{
		tag: [t.typeName, t.className, t.tagName, t.number, t.changed, t.annotation, t.self, t.namespace],
		color: '#55c2bc'
	},
	{ tag: [t.function(t.variableName), t.function(t.propertyName), t.attributeName, t.labelName], color: '#bd96fe' },
	{ tag: [t.atom, t.number], color: '#dd9f6b' },
	{ tag: [t.regexp], color: '#7fc08c' },
	{ tag: [t.string, t.special(t.string), t.inserted], color: '#8cc3fc' },
	{ tag: [t.bool, t.self, t.variableName], color: '#5cb3ff' },
	{ tag: [t.meta, t.comment, t.angleBracket], color: 'color-mix(in srgb, var(--color-text), transparent 25%)' },
	{ tag: t.invalid, color: 'black', backgroundColor: 'red' },
	{ tag: t.url, textDecoration: 'underline' },
	{ tag: t.inserted, color: 'var(--color-good)' },
	{ tag: t.deleted, color: 'var(--color-danger)' }
])

const editorTheme = EditorView.theme({
	'&.cm-focused': { outline: 'none' },
	'.cm-scroller': {
		overflow: 'initial',
		fontFamily: 'Roboto, system-ui, sans-serif !important',
		lineHeight: '1.25rem'
	},
	'.cm-content': {
		margin: '-2px',
		padding: '.5rem'
	},
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
