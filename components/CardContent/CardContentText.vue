<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
import type {
	DecorationSet,
	PluginValue,
	ViewUpdate
} from '@codemirror/view'
import { Decoration, EditorView, MatchDecorator, ViewPlugin, WidgetType, drawSelection, dropCursor,	highlightSpecialChars, highlightTrailingWhitespace, keymap, rectangularSelection } from '@codemirror/view'
import { Compartment, EditorState, RangeSet, StateField } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, LanguageSupport, StreamLanguage, bracketMatching, defaultHighlightStyle, foldKeymap, indentOnInput, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { Tag, tags as t, tags } from '@lezer/highlight'

// Stuff here

import { languages } from '@codemirror/language-data'
import { Table } from '@lezer/markdown'
import { parseMixed } from '@lezer/common'
import type { SyntaxNodeRef } from '@lezer/common'
import type { InlineContext, MarkdownConfig, MarkdownExtension } from '@lezer/markdown'
import { stex } from '@codemirror/legacy-modes/mode/stex'
import markdoc from '@markdoc/markdoc'
import type { Range, SelectionRange } from '@codemirror/state'

const { card } = defineProps(['card'])

const emit = defineEmits(['activate'])

const contentRef = ref()
const active = ref(false)
const editable = new Compartment()

let view: EditorView

function checkSelection(cursor: SelectionRange, node: SyntaxNodeRef) {
	return (
		cursorIsExactlyOn(cursor, node)
		|| (cursor.to >= node.to && cursor.from <= node.from)
	) && view && view.hasFocus
}

function cursorIsExactlyOn(cursor: SelectionRange, node: SyntaxNodeRef) {
	return (
		(cursor.to >= node.from && cursor.to <= node.to)
		|| (cursor.from >= node.from && cursor.from <= node.to)
	) && view && view.hasFocus
}

function idForHeader(header: string) {
	return header
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

function goTo(id: string) {
	syntaxTree(view.state).iterate({
		enter(node) {
			if (node.name.startsWith('ATXHeading')) {
				const text = view.state.doc.sliceString(node.from, node.to)
				const hId = idForHeader(text.replace(/^#+\s*/, ''))

				if (hId === id) {
					view.dispatch({
						selection: { anchor: node.from },
						scrollIntoView: true
					})
					return false
				}
			}
		}
	})
}

function openUrl(url: string) {
	if (url.startsWith('#'))
		return goTo(url.substring(1).toLowerCase())

	window.open(url, '_blank')
}

function openLink(link: string) {
	const regex = /\[.*?\]\((.*?)\)/
	const match = link.match(regex)
	const url = match ? match[1] : null

	if (!url) {
		console.error(`Failed to parse link ${link}`)
		return
	}

	openUrl(url)
}

function linkAction() {
	for (const { from, to } of view.visibleRanges) {
		const [cursor] = view.state.selection.ranges

		syntaxTree(view.state).iterate({
			from,
			to,

			enter(node) {
				if (node.name === 'Link') {
					if (cursorIsExactlyOn(cursor, node)) {
						const text = view.state.doc.sliceString(node.from, node.to)
						openLink(text)
						return false
					}
				}
				if (node.name === 'URL') {
					if (cursorIsExactlyOn(cursor, node)) {
						const text = view.state.doc.sliceString(node.from, node.to)
						openUrl(text)
						return false
					}
				}
			}
		})
	}
}

const tokenElement = [
	'InlineCode',
	// "FencedCodeBlock",
	'Underline',
	'UnderlineItalic',
	'Strikethrough',
	'Emphasis',
	'StrongEmphasis',
	'Link'
]

const tokenHidden = [
	'HardBreak',
	'EmphasisMark',
	'UnderlineMark',
	'UnderlineItalicMark',
	'StrikethroughMark',
	'LinkMark'
]

const decorationHidden = Decoration.mark({ class: 'cm-markdoc-hidden' })
const decorationLink = Decoration.mark({ class: 'cm-markdown-link' })
const decorationBullet = Decoration.mark({ class: 'cm-markdoc-bullet' })
const decorationCodeBlock = Decoration.mark({ class: 'cm-markdown-codeblock' })
const decorationInlineCode = Decoration.mark({
	class: 'cm-markdown-inline-code'
})
const decorationFakeHidden = Decoration.mark({
	attributes: { class: 'cm-markdoc-fake-hidden' }
})
const decorationTaskMarkerTextChecked = Decoration.mark({
	attributes: { class: 'cm-markdoc-task-marker-text-checked' }
})
const decorationBlockquote = Decoration.mark({
	attributes: { class: 'cm-markdoc-blockquote' }
})

class RichEditPlugin implements PluginValue {
	decorations: DecorationSet

	constructor(view: EditorView) {
		this.decorations = this.process(view)
	}

	update(update: ViewUpdate): void {
		if (update.docChanged || update.viewportChanged || update.selectionSet)
			this.decorations = this.process(update.view)
	}

	process(view: EditorView): DecorationSet {
		const decorations: Range<Decoration>[] = []
		const [cursor] = view.state.selection.ranges

		for (const { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					const inSelection = checkSelection(cursor, node)

					if (node.name === 'InlineCode')
						decorations.push(decorationInlineCode.range(node.from, node.to))

					if (node.name === 'Link' || node.name === 'URL')
						decorations.push(decorationLink.range(node.from, node.to))

					if (
						inSelection
						&& (node.name.startsWith('ATXHeading')
						|| tokenElement.includes(node.name))
					)
						return false

					/* if (
						node.name === 'ListMark'
						&& node.matchContext(['BulletList', 'ListItem'])
						&& cursor.from != node.from
						&& cursor.from != node.from + 1
						&& !inSelection
					)
						decorations.push(decorationBullet.range(node.from, node.to)) */

					if (node.name === 'CodeText')
						decorations.push(decorationCodeBlock.range(node.from, node.to))

					if (node.name === 'HeaderMark') {
						const text = view.state.doc.sliceString(node.from, node.to)
						if (text.startsWith('#'))
							decorations.push(decorationHidden.range(node.from, node.to + 1))
					}

					if (node.name === 'CodeMark') {
						const text = view.state.doc.sliceString(node.from, node.to)
						if (text.length === 1)
							decorations.push(decorationHidden.range(node.from, node.to))
					}

					if (node.name === 'URL' && node.matchContext(['Link']))
						decorations.push(decorationHidden.range(node.from, node.to))

					if (tokenHidden.includes(node.name))
						decorations.push(decorationHidden.range(node.from, node.to))
				}
			})
		}

		return Decoration.set(decorations)
	}
}

class RenderBlockWidget extends WidgetType {
	rendered: string

	constructor(public source: string) {
		super()

		const document = markdoc.parse(source)
		const transformed = markdoc.transform(document)
		this.rendered = markdoc.renderers.html(transformed)
	}

	eq(widget: RenderBlockWidget): boolean {
		return widget.source === widget.source
	}

	toDOM(): HTMLElement {
		const content = document.createElement('div')
		content.setAttribute('contenteditable', 'false')
		content.className = 'cm-markdoc-renderBlock'
		content.innerHTML = this.rendered
		return content
	}

	ignoreEvent(): boolean {
		return false
	}
}

class RenderCheckboxWidget extends WidgetType {
	checked: boolean

	constructor(public source: string) {
		super()

		this.checked = source.toLocaleLowerCase().includes('x')
	}

	/* eq(widget: RenderLatexWidget): boolean {
		return widget.source === widget.source
	} */

	toDOM(): HTMLElement {
		const wrap = document.createElement('span')

		wrap.setAttribute('aria-hidden', 'true')
		wrap.className = 'cm-markdown-checkbox'

		const box = wrap.appendChild(document.createElement('input'))

		box.type = 'checkbox'
		box.checked = this.checked

		return wrap
	}

	ignoreEvent(): boolean {
		return false
	}
}

function toggleCheckbox(view: EditorView, pos: number) {
	pos += 2

	const isChecked = view.state.doc.sliceString(pos + 1, pos + 2) === 'x'
	let change: { from: number, to: number, insert: string }

	if (isChecked)
		change = { from: pos + 1, to: pos + 2, insert: ' ' }
	else change = { from: pos + 1, to: pos + 2, insert: 'x' }

	view.dispatch({ changes: change })
	return true
}

function replaceSpecialWidgets(state: EditorState, from?: number, to?: number) {
	const decorations: Range<Decoration>[] = []
	const [cursor] = state.selection.ranges

	syntaxTree(state).iterate({
		from,
		to,
		enter(node) {
			if (
				![
					'Table',
					'Blockquote',
					'Checkbox',
					'TaskMarker'
				].includes(node.name)
			)
				return

			if (node.name === 'TaskMarker') {
				const fakeNode = node

				fakeNode.from -= 2

				decorations.push(decorationTaskMarkerTextChecked.range(node.from + 3, node.to - 1))

				if (checkSelection(cursor, fakeNode))
					return false
			}
			else if (checkSelection(cursor, node)) 
				return false


			switch (node.name) {
				case 'TaskMarker': {
					const text = state.doc.sliceString(node.from, node.to)

					const decoration = Decoration.widget({
						widget: new RenderCheckboxWidget(text)
					})

					decorations.push(decoration.range(node.from))
					decorations.push(decorationHidden.range(node.from, node.to))
					break
				}

				case 'Blockquote': {
					decorations.push(decorationBlockquote.range(node.from, node.to))
					break
				}

				case 'Table': {
					const text = state.doc.sliceString(node.from, node.to)
					const decoration = Decoration.widget({
						widget: new RenderBlockWidget(text)
					})

					decorations.push(decoration.range(node.from))
					decorations.push(decorationFakeHidden.range(node.from, node.to))
					break
				}
			}
		}
	})

	return decorations
}

function replaceSpecial() {
	return StateField.define<DecorationSet>({
		create(state) {
			return RangeSet.of(replaceSpecialWidgets(state), true)
		},

		update(_decorations, transaction) {
			// TODO use decorations.update
			return RangeSet.of(replaceSpecialWidgets(transaction.state), true)
		},

		provide(field) {
			return EditorView.decorations.from(field)
		}
	})
}

const texLang = new LanguageSupport(StreamLanguage.define(stex))

const DELIMITER = {
	mark: 'DollarDollarLatexMark',
	resolve: 'LatexTag'
}

const tagParser = {
	defineNodes: [
		{ name: 'DollarDollarLatexMark', style: t.processingInstruction },
		{ name: 'LatexTag', block: true, style: t.meta }
	],
	wrap: parseMixed((node, input) => {
		const name = node.type.name
		if (name == 'LatexTag') {
			return {
				parser: texLang.language.parser,
				overlay: [
					{
						from: node.from + 2,
						to: node.to - 2
					}
				]
			}
		}
		return null
	}),
	parseInline: [
		{
			name: 'LatexTag',
			before: 'Escape', // Search for this delimiter before the escape character
			parse(cx: InlineContext, next: number, pos: number): number {
				if (next != 36 /* '$' */ || cx.char(pos + 1) != 36)
					return -1

				return cx.addDelimiter(DELIMITER, pos, pos + 2, true, true)
			}
		}
	]
} satisfies MarkdownConfig

const underlineTag = Tag.define()
const underlineItalicTag = Tag.define()

const Punctuation = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\xA1\u2010-\u2027]/

const char = '_'.charCodeAt(0)
const UnderlineDelim = { resolve: 'Underline', mark: 'UnderlineMark' }
const Underline = {
	defineNodes: [
		{
			name: 'Underline',
			style: { 'Underline/...': underlineTag }
		},
		{
			name: 'UnderlineMark',
			style: tags.processingInstruction
		}
	],
	parseInline: [
		{
			name: 'Underline',
			parse(cx, next, pos) {
				if (
					next != char
					|| cx.char(pos + 1) != char
					|| cx.char(pos + 2) == char
				) 
					return -1


				const before = cx.slice(pos - 1, pos)
				const after = cx.slice(pos + 2, pos + 3)

				const spaceBefore = /\s|^$/.test(before)
				const spaceAfter = /\s|^$/.test(after)

				const punctuationBefore = Punctuation.test(before)
				const punctuationAfter = Punctuation.test(after)

				return cx.addDelimiter(
					UnderlineDelim,
					pos,
					pos + 2,
					!spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore),
					!spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)
				)
			},
			before: 'Emphasis'
		}
	]
} satisfies MarkdownExtension

const UnderlineItalicDelim = { resolve: 'UnderlineItalic', mark: 'UnderlineItalicMark' }

const UnderlineItalic = {
	defineNodes: [
		{
			name: 'UnderlineItalic',
			style: { 'UnderlineItalic/...': underlineItalicTag }
		},
		{
			name: 'UnderlineItalicMark',
			style: tags.processingInstruction
		}
	],
	parseInline: [
		{
			name: 'UnderlineItalic',
			parse(cx, next, pos) {
				if (
					next != char
					|| cx.char(pos + 1) != char
					|| cx.char(pos + 2) != char
					|| cx.char(pos + 3) == char
				) 
					return -1


				const before = cx.slice(pos - 1, pos)
				const after = cx.slice(pos + 2, pos + 4)

				const spaceBefore = /\s|^$/.test(before)
				const spaceAfter = /\s|^$/.test(after)

				const punctuationBefore = Punctuation.test(before)
				const punctuationAfter = Punctuation.test(after)

				return cx.addDelimiter(
					UnderlineItalicDelim,
					pos,
					pos + 3,
					!spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore),
					!spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)
				)
			},
			before: 'Emphasis'
		}
	]
} satisfies MarkdownExtension

function viewPlugin() {
	return ViewPlugin.fromClass(RichEditPlugin, {
		decorations: v => v.decorations,
		provide: v => [
			replaceSpecial(),
			markdown({
				base: markdownLanguage,
				codeLanguages: languages,
				extensions: [Table, Underline, UnderlineItalic, tagParser]
			})
		],
		eventHandlers: {
			mousedown({ target }, view) {
				if (
					target instanceof Element
					&& (target.matches('.cm-markdoc-renderBlock *')
					|| target.matches('.cm-markdown-katex *'))
				)
					view.dispatch({ selection: { anchor: view.posAtDOM(target) } })

				// TODO: should not be mouse down event
				if (
					target instanceof HTMLInputElement
					&& target.matches('.cm-markdown-checkbox *')
				)
					return toggleCheckbox(view, view.posAtDOM(target))

				if (target instanceof HTMLSpanElement) {
					const link = target.closest('.cm-markdown-link')

					if (link !== null) {
						// Wait for the cursor to move
						requestAnimationFrame(() => {
							linkAction()
						})
					}
				}
			}
		}
	})
}

const decorationTodo = Decoration.mark({ class: 'cm-markdown-todo' })
const decorationComment = Decoration.mark({ class: 'cm-markdown-comment' })

function highlightSpecial() {
	return ViewPlugin.fromClass(MyClass, {
		decorations: v => v.decorations
	})
}

function highlightComments() {
	return ViewPlugin.fromClass(MyClass2, {
		decorations: v => v.decorations
	})
}

class MyClass implements PluginValue {
	view: EditorView
	decorations: DecorationSet
	decorator: MatchDecorator

	constructor(view: EditorView) {
		this.view = view
		this.decorations = Decoration.none
		this.decorator = this.makeDecorator()
		this.decorations = this.decorator.createDeco(view)
	}

	makeDecorator() {
		return new MatchDecorator({
			regexp: /^.*todo.*$/gi,
			decoration: () => {
				return decorationTodo
			}
		})
	}

	update(update: ViewUpdate) {
		this.decorations = this.decorator.updateDeco(update, this.decorations)
	}
}

class MyClass2 implements PluginValue {
	view: EditorView
	decorations: DecorationSet
	decorator: MatchDecorator

	constructor(view: EditorView) {
		this.view = view
		this.decorations = Decoration.none
		this.decorator = this.makeDecorator()
		this.decorations = this.decorator.createDeco(view)
	}

	makeDecorator() {
		return new MatchDecorator({
			regexp: /^\/\/.*$/g,
			decoration: () => {
				return decorationComment
			}
		})
	}

	update(update: ViewUpdate) {
		this.decorations = this.decorator.updateDeco(update, this.decorations)
	}
}

const editorTheme = EditorView.theme(
	{
		'.cm-selectionBackground': {
			backgroundColor: 'var(--color-accent-25) !important'
		}
	},
	{ dark: true }
)

const highlightStyle = HighlightStyle.define([
	{
		tag: t.heading1,
		fontWeight: 'bold',
		fontSize: '1.125rem'
	},
	{
		tag: t.heading2,
		fontWeight: 'bold'
	},
	{
		tag: t.heading3,
		fontWeight: 'bold'
	},
	{
		tag: t.heading4,
		fontWeight: 'bold'
	},
	{
		tag: t.heading5,
		fontWeight: 'bold'
	},
	{
		tag: t.heading6,
		fontWeight: 'bold'
	},

	{ tag: t.meta, color: 'color: var(--color-text)', opacity: '.5' },

	{ tag: [t.link, t.url], textDecoration: 'underline', color: 'var(--color-accent)' },

	{ tag: t.heading, textDecoration: 'underline', fontWeight: 'bold' },
	{ tag: t.emphasis, fontStyle: 'italic' },
	{ tag: t.strong, fontWeight: 'bold' },
	{ tag: t.strikethrough, textDecoration: 'line-through' },
	{
		tag: [t.atom, t.bool, t.contentSeparator, t.labelName],
		color: '#ffa'
	},
	{ tag: [t.literal, t.inserted], color: '#164' },
	{ tag: [t.regexp, t.escape, t.special(t.string)], color: '#e40' },
	{ tag: t.local(t.variableName), color: '#30a' },
	{ tag: [t.special(t.variableName), t.macroName], color: '#256' },
	{ tag: t.invalid, color: '#f00' },

	{ tag: t.comment, color: '#6a737d' }, // Comments
	{ tag: t.docComment, color: '#6a737d' }, // Documentation comments
	{ tag: t.lineComment, color: '#6a737d' }, // Line comments
	{ tag: t.blockComment, color: '#6a737d' }, // Block comments
	{ tag: t.variableName, color: '#e1e4e8' }, // Variable names
	{ tag: t.local(t.variableName), color: '#e1e4e8' }, // Local variable names
	{ tag: t.special(t.variableName), color: '#ffab70' }, // Special variables (like `this`)
	{ tag: t.string, color: '#9ecbff' }, // Strings
	{ tag: t.special(t.string), color: '#79b8ff' }, // Special string literals
	{ tag: t.number, color: '#79b8ff' }, // Numbers
	{ tag: t.integer, color: '#79b8ff' }, // Integers
	{ tag: t.float, color: '#79b8ff' }, // Floating-point numbers
	{ tag: t.bool, color: '#79b8ff' }, // Booleans
	{ tag: t.null, color: '#79b8ff' }, // Null values
	{ tag: t.keyword, color: '#f97583' }, // Keywords
	{ tag: t.definitionKeyword, color: '#f97583' }, // Definition keywords (e.g., function, class)
	{ tag: t.operatorKeyword, color: '#f97583' }, // Operator keywords (e.g., instanceof)
	{ tag: t.controlKeyword, color: '#ffab70' }, // Control flow keywords
	{ tag: t.function(t.variableName), color: '#b392f0' }, // Function names
	{ tag: t.function(t.definitionKeyword), color: '#b392f0' }, // Function definitions
	{ tag: t.function(t.special(t.variableName)), color: '#b392f0' }, // Special functions (e.g., constructor)
	{ tag: t.tagName, color: '#85e89d' }, // HTML tag names
	{ tag: t.self, color: '#e1e4e8' }, // Self (e.g., this in JS)
	{ tag: t.attributeName, color: '#f5c6aa' }, // Attribute names in HTML
	{ tag: t.propertyName, color: '#dcbdfb' }, // Property names in objects
	{ tag: t.className, color: '#e1e4e8' }, // Class names
	{ tag: t.constant(t.variableName), color: '#f69d50' }, // Constants
	{ tag: t.labelName, color: '#85e89d' }, // Label names (e.g., labels in switch statements)
	{ tag: t.meta, color: '#b392f0' }, // Meta elements (e.g., import.meta)
	{ tag: t.regexp, color: '#db61a2' }, // Regular expressions
	{ tag: t.moduleKeyword, color: '#ffab70' }, // Module keywords
	{ tag: t.keyword, color: '#f97583' }, // Additional keywords
	{ tag: t.annotation, color: '#ffab70' }, // Annotations (e.g., decorators)
	{ tag: t.url, color: '#79b8ff' }, // URLs
	{ tag: t.escape, color: '#db61a2' }, // Escape sequences
	{ tag: t.separator, color: '#e1e4e8' }, // Separators (e.g., commas)
	{ tag: t.punctuation, color: '#e1e4e8' }, // Punctuation marks
	{ tag: t.bracket, color: '#e1e4e8' }, // Brackets
	{ tag: t.angleBracket, color: '#e1e4e8' }, // Angle brackets
	{ tag: t.squareBracket, color: '#e1e4e8' }, // Square brackets
	{ tag: t.paren, color: '#e1e4e8' }, // Parentheses
	{ tag: t.brace, color: '#e1e4e8' }, // Braces

	{
		tag: underlineTag,
		textDecoration: 'underline'
	},
	{
		tag: underlineItalicTag,
		textDecoration: 'underline',
		fontStyle: 'italic'
	}
])

const theme = [editorTheme, syntaxHighlighting(highlightStyle)]
// End

onMounted(() => {
	view = new EditorView({
		doc: card.content,
		extensions: [
			// vim(),

			theme,
			viewPlugin(),

			bracketMatching(),
			closeBrackets(),
			drawSelection(),
			dropCursor(),
			// highlightTrailingWhitespace(),
			// highlightWhitespace(),
			history(),

			indentOnInput(),
			highlightSpecialChars(),

			EditorState.allowMultipleSelections.of(true),

			rectangularSelection(),

			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				...lintKeymap,
				indentWithTab
			]),

			highlightSpecial(),
			highlightComments(),

			editable.of(EditorView.editable.of(false))
		],
		parent: contentRef.value
	})

	view.contentDOM.addEventListener('blur', onBlur)

	// Activate new cards
	if (card.id === 'new:empty')
		activate()
})

onBeforeUnmount(() => {
	view.contentDOM.removeEventListener('blur', onBlur)
	view.destroy()
})

function onKeyDownDel() {
	if (isEmpty())
		view.contentDOM.blur()
}

function onKeyDownEsc(event: KeyboardEvent) {
	// Prevent navigation
	event.stopPropagation()
	view.contentDOM.blur()
}

function activate() {
	if (active.value)
		return

	active.value = true

	view.dispatch({
		effects: editable.reconfigure(EditorView.editable.of(true))
	})
	view.focus()
	emit('activate')
}

async function onBlur() {
	active.value = false

	view.dispatch({
		effects: editable.reconfigure(EditorView.editable.of(false)),
		selection: { anchor: 0 }
	})

	// Delete empty cards
	if (isEmpty())
		return fetchDeleteCard(card)

	card.content = view.state.doc.toString()

	fetchUpdateCard(card)
}

function isEmpty() {
	return view.state.doc.toString().trim().length === 0
}

defineExpose({ active })
</script>

<template>
	<div
		ref="contentRef"
		class="card-content card-content-text"
		@click.left.exact="activate"
		@keydown.escape="onKeyDownEsc"
		@keydown.delete="onKeyDownDel"
	/>
</template>

<style lang="scss">
.card-content-text {
	padding: .375rem;
	font-size: .875rem;
	background-color: #222;
	border: 2px solid var(--color-border);
	border-radius: .375rem;
	box-shadow: var(--shadow-card);
}

/* stylelint-disable */

.cm-content {
	padding: 0 !important;
	font-family: Roboto, system-ui, sans-serif;
	line-height: 1.25rem;
}

.cm-scroller {
	overflow-x: initial !important;
}

.cm-line {
	position: relative;
  padding: 0 !important;
}

.cm-cursor,
.cm-dropCursor {
	width: 2px;

	// margin: 0 !important;
	background-color: var(--color-text);
	border: none !important;
}

.cm-matchingBracket {
	background-color: var(--color-good-25) !important;
}

.cm-nonmatchingBracket,
.cm-trailingSpace {
	background-color: var(--color-danger-25) !important;
}

.ͼ6 {
	text-decoration: none;
}

.ͼb {
	color: oklch(80% .125 340deg);
}

.ͼc {
	color: var(--color-accent);
}

.ͼd {
	color: var(--color-good);
}

.ͼe {
	color: var(--color-danger);
}

.ͼg,
.ͼl {
	color: var(--color-accent);
}

.ͼi {
	color: var(--color-good);
}

.ͼm {
	color: var(--color-text);
	opacity: .5;
}

.cm-markdoc-hidden {
  display: none;
}

.cm-line > :first-child:has(+ .cm-markdown-checkbox) {
  -display: none;
}

.cm-markdoc-task-marker-text-checked {
	font-family: 'Fira Code', monospace;
	line-height: 1rem;
}

.cm-markdown-checkbox {
	position: relative;
	top: 1px;
	margin-inline-end: .25rem;
}

.cm-markdown-checkbox input {
	display: inline-block;
	width: .75rem;
	height: .75rem;
	margin: 0;
}

.cm-markdoc-bullet::after {
  display: inline !important;
  color: darkgray;
  -content: "•";
}

.cm-markdoc-fake-hidden {
  opacity: 0;
}

.cm-markdoc-renderBlock {
  position: absolute;
}

.cm-markdoc-blockquote::before {
  content: "";
  position: absolute;
  border-left: 2px solid #fff4;
  height: 1.25rem;
}

.cm-markdoc-blockquote :first-child {
  opacity: 0;
}

.cm-markdoc-renderBlock table {
  border-collapse: collapse;
  margin-left: 5px;
}

.cm-markdoc-renderBlock th,
.cm-markdoc-renderBlock td {
  border: 1px solid lightgray;

  padding-left: 10px;
  padding-right: 10px;

  padding-top: 0;
  padding-bottom: 0;
}

.cm-markdoc-renderBlock tr {
  line-height: calc(1.4em - 1px);
}

.cm-markdoc-renderBlock thead tr {
  line-height: calc(2.8em - 1px);
}

.cm-markdown-inline-code {
	padding-inline: .125rem;
  background-color: #0004;
  border-radius: 0.25em;
}

.cm-markdown-inline-code,
.cm-markdown-codeblock {
	color: color-mix(in oklab, currentColor 90%, black);
  font-family: 'Fira Code', monospace;
	line-height: 1rem
}

.cm-line:has(.cm-markdown-codeblock) {
	-background: #0002;
}

.cm-markdown-link {
  cursor: pointer;
}

input {
  color: inherit;
}

.cm-markdown-todo {
  color: var(--color-warn);
}

.cm-markdown-comment {
	color: color-mix(in oklab, var(--color-text) 50%, transparent);
}

/* .overview .cm-line {
	color: transparent;
	background-color: #0002;
	transition: color .2s;
} */

// more classes till n
</style>
