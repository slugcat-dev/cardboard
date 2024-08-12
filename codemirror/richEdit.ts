import { Decoration, type DecorationSet, type EditorView, type PluginValue, type ViewUpdate, WidgetType } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import type { Range, SelectionRange } from '@codemirror/state'
import type { SyntaxNodeRef } from '@lezer/common'

const tokenElement = [
	'Escape',
	'Emphasis',
	'StrongEmphasis',
	'Underline',
	'UnderlineItalic',
	'Strikethrough',
	'InlineCode',
	'Link'
]
const tokenHidden = [
	'EscapeMark',
	'EmphasisMark',
	'UnderlineMark',
	'UnderlineItalicMark',
	'StrikethroughMark',
	'LinkMark'
]
const decorationHeading = Decoration.mark({ tagName: 'h1', class: 'cm-markdown-heading' })
const decorationInlineCode = Decoration.mark({ class: 'cm-markdown-inline-code' })
const decorationHighlight = Decoration.mark({ class: 'cm-markdown-highlight' })
const decorationTaskMarker = Decoration.mark({ class: 'cm-markdown-task-marker' })
const decorationBlockquote = Decoration.mark({ class: 'cm-markdown-blockquote' })
const decorationCodeBlock = Decoration.line({ class: 'cm-markdown-code-block' })
const decorationHidden = Decoration.mark({ class: 'cm-markdown-hidden' })

function decorationURL(url: string, fake: boolean) {
	if (fake)
		return Decoration.mark({ class: 'cm-markdown-url' })

	return Decoration.mark({
		tagName: 'a',
		class: 'cm-markdown-url',
		attributes: {
			href: url,
			target: '_blank'
		}
	})
}

export class RichEditPlugin implements PluginValue {
	decorations: DecorationSet

	constructor(view: EditorView) {
		this.decorations = this.process(view)
	}

	update(update: ViewUpdate) {
		if (
			update.docChanged
			|| update.viewportChanged
			|| update.selectionSet
			|| update.focusChanged
		)
			this.decorations = this.process(update.view)
	}

	process(view: EditorView) {
		const decorations: Range<Decoration>[] = []
		const [cursor] = view.state.selection.ranges

		view.visibleRanges.forEach(({ from, to }) => {
			const tree = syntaxTree(view.state)

			// Replace special widgets
			tree.iterate({ from, to, enter(node) {
				switch (node.name) {
					case 'ATXHeading1':
						decorations.push(decorationHeading.range(node.from, node.to))

						break

					case 'InlineCode':
						decorations.push(decorationInlineCode.range(node.from, node.to))

						break

					case 'Highlight':
						decorations.push(decorationHighlight.range(node.from, node.to))

						break

					case 'URL': {
						const text = view.state.doc.sliceString(node.from, node.to)
						let url = text

						if (/^[^\W_](?:[\w.+-]*[^\W_])?@[^\W_](?:[\w-]*[^\W_])?(?:\.[^\W_](?:[\w-]*[^\W_])?)*/.test(text))
							url = `mailto:${text}`

						decorations.push(decorationURL(url, view.hasFocus).range(node.from, node.to))

						break
					}

					case 'FencedCode': {
						const startLine = view.state.doc.lineAt(node.from)
						const endLine = view.state.doc.lineAt(node.to)

						for (let line = startLine.number; line <= endLine.number; line++)
							decorations.push(decorationCodeBlock.range(view.state.doc.line(line).from))

						break
					}

					case 'TaskMarker': {
						decorations.push(decorationTaskMarker.range(node.from + 1, node.to - 1))

						if (checkSelection(cursor, { ...node, from: node.from - 2 }) && view.hasFocus)
							break

						const text = view.state.doc.sliceString(node.from, node.to)
						const decorationCheckbox = Decoration.widget({ widget: new RenderCheckboxWidget(text) })

						decorations.push(decorationHidden.range(node.from - 2, node.to))
						decorations.push(decorationCheckbox.range(node.to))

						break
					}
				}
			} })

			// Hide block markers
			let visible: string[] = []

			tree.iterate({ from, to, enter(node) {
				const inSelection = checkSelection(cursor, node) && view.hasFocus

				if (inSelection) {
					if (node.name.startsWith('ATXHeading'))
						visible.push('HeaderMark')
					else if (node.name === 'Highlight')
						visible.push('HighlightMark')
					else if (node.name === 'Blockquote')
						visible.push('QuoteMark')
				}

				if (visible.includes(node.name))
					return

				if (node.name === 'HeaderMark')
					decorations.push(decorationHidden.range(node.from, node.to + 1))
				else if (node.name === 'HighlightMark')
					decorations.push(decorationHidden.range(node.from, node.to + 1))
				else if (node.name === 'QuoteMark')
					decorations.push(decorationBlockquote.range(node.from, node.to))
			}, leave(node) {
				if (node.name.startsWith('ATXHeading'))
					visible = visible.filter(item => item !== 'HeaderMark')
				else if (node.name.startsWith('Highlight'))
					visible = visible.filter(item => item !== 'HighlightMark')
				else if (node.name.startsWith('Blockquote'))
					visible = visible.filter(item => item !== 'QuoteMark')
			} })

			// Hide inline markers
			tree.iterate({ from, to, enter(node) {
				const inSelection = checkSelection(cursor, node) && view.hasFocus
				const text = view.state.doc.sliceString(node.from, node.to)

				if (tokenElement.includes(node.name))
					return !inSelection
				else if (tokenHidden.includes(node.name))
					decorations.push(decorationHidden.range(node.from, node.to))
				else if (node.name === 'CodeMark' && text.length === 1)
					decorations.push(decorationHidden.range(node.from, node.to))
			} })
		})

		return Decoration.set(decorations, true)
	}
}

class RenderCheckboxWidget extends WidgetType {
	checked: boolean

	constructor(source: string) {
		super()

		this.checked = source.toLowerCase().includes('x')
	}

	toDOM() {
		const wrapper = document.createElement('span')
		const checkbox = document.createElement('input')

		checkbox.type = 'checkbox'
		checkbox.checked = this.checked

		wrapper.classList.add('cm-markdown-checkbox')
		checkbox.setAttribute('aria-hidden', 'true')
		checkbox.setAttribute('tabindex', '-1')
		wrapper.appendChild(checkbox)

		return wrapper
	}

	override ignoreEvent() {
		return false
	}
}

function cursorIsExactlyOn(cursor: SelectionRange, node: SyntaxNodeRef) {
	return ((cursor.to >= node.from && cursor.to <= node.to)
		|| (cursor.from >= node.from && cursor.from <= node.to))
}

function checkSelection(cursor: SelectionRange, node: SyntaxNodeRef) {
	return (cursorIsExactlyOn(cursor, node)
		|| (cursor.to >= node.to && cursor.from <= node.from))
}
