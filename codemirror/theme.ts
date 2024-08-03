import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { markTag, underlineItalicTag, underlineTag } from './customTags'

const highlightStyle = HighlightStyle.define([
	{ tag: markTag, class: 'cm-markdown-mark' },
	{ tag: [t.heading, t.strong], fontWeight: 'bold' },
	{ tag: t.emphasis, class: 'cm-markdown-italic' },
	{ tag: underlineTag, class: 'cm-markdown-underline' },
	{ tag: underlineItalicTag, class: 'cm-markdown-underline cm-markdown-italic' },
	{ tag: t.strikethrough, class: 'cm-markdown-strikethrough' },
	{ tag: t.url, color: 'var(--color-accent)' },

	/*
	GitHub Dark
	{ tag: t.keyword, color: '#f97583' },
	{ tag: t.name, color: 'inherit' },
	{ tag: t.deleted, color: '#f97583' },
	{ tag: t.character, color: '#79b8ff' },
	{ tag: t.propertyName, color: '#9ecbff' },
	{ tag: t.macroName, color: '#79b8ff' },
	{ tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#b392f0' },
	{ tag: t.labelName, color: '#79b8ff' },
	{ tag: t.color, color: '#79b8ff' },
	{ tag: t.constant(t.name), color: '#85e89d' },
	{ tag: t.standard(t.name), color: '#f97583' },
	{ tag: t.typeName, color: '#b392f0' },
	{ tag: t.className, color: '#b392f0' },
	{ tag: t.number, color: '#ffab70' },
	{ tag: t.changed, color: '#ffab70' },
	{ tag: t.annotation, color: '#b392f0' },
	{ tag: t.modifier, color: '#f69d50' },
	{ tag: t.self, color: '#79b8ff' },
	{ tag: t.namespace, color: '#b392f0' },
	{ tag: t.operator, color: '#f97583' },
	{ tag: t.derefOperator, color: 'inherit' },
	{ tag: t.operatorKeyword, color: '#f97583' },
	{ tag: t.escape, color: '#f69d50' },
	{ tag: t.regexp, color: '#79b8ff' },
	{ tag: t.link, color: '#79b8ff' },
	{ tag: t.special(t.string), color: '#9ecbff' },
	{ tag: t.meta, color: '#6a737d' },
	{ tag: t.comment, color: '#6a737d' },
	{ tag: t.atom, color: '#ffab70' },
	{ tag: t.bool, color: '#79b8ff' },
	{ tag: t.special(t.variableName), color: '#b392f0' },
	{ tag: t.processingInstruction, color: '#f97583' },
	{ tag: t.string, color: '#9ecbff' },
	{ tag: t.inserted, color: '#85e89d' },
	{ tag: t.invalid, color: 'hotpink' },
	{ tag: t.typeOperator, color: 'red' }

	Sublime
	{ tag: [t.meta, t.comment], color: '#A2A9B5' },
	{ tag: [t.attributeName, t.keyword], color: '#B78FBA' },
	{ tag: t.function(t.variableName), color: '#5AB0B0' },
	{ tag: [t.string, t.regexp, t.attributeValue], color: '#99C592' },
	{ tag: t.operator, color: '#f47954' },
	{ tag: [t.tagName, t.modifier], color: '#E35F63' },
	{ tag: [t.number, t.definition(t.tagName), t.className, t.definition(t.variableName)], color: '#fbac52' },
	{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#E35F63' },
	{ tag: t.variableName, color: '#539ac4' },
	{ tag: [t.propertyName, t.typeName], color: '#629ccd' },
	{ tag: t.propertyName, color: '#36b7b5' }
	 */

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
			t.bool,
			t.special(t.variableName)
		],
		color: '#569cd6'
	},
	{ tag: [t.controlKeyword, t.moduleKeyword], color: '#c586c0' },
	{
		tag: [
			t.name,
			t.deleted,
			t.character,
			t.macroName,
			t.propertyName,
			t.variableName,
			t.labelName,
			t.definition(t.name)
		],
		color: '#9cdcfe'
	},
	{
		tag: [t.typeName, t.className, t.tagName, t.number, t.changed, t.annotation, t.self, t.namespace],
		color: '#4ec9b0'
	},
	{ tag: [t.function(t.variableName), t.function(t.propertyName), t.atom], color: '#dcdcaa' },
	{ tag: [t.number], color: '#b5cea8' },
	{ tag: [t.operator, t.punctuation, t.separator, t.escape, t.regexp], color: '#d4d4d4' },
	{ tag: [t.regexp], color: '#d16969' },
	{ tag: [t.special(t.string), t.processingInstruction, t.string, t.inserted], color: '#ce9178' },
	{ tag: [t.angleBracket], color: '#808080' },
	{ tag: [t.meta, t.comment], color: '#808080' },
	{ tag: t.invalid, color: '#ff0000' }
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
