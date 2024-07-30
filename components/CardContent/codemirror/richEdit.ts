import { Decoration, type DecorationSet, EditorView, MatchDecorator, type PluginValue, type ViewUpdate, WidgetType } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { type EditorState, type Range, RangeSet, type SelectionRange, StateField } from '@codemirror/state'
import type { SyntaxNodeRef } from '@lezer/common'

const tokenElement = [
	'Emphasis',
	'StrongEmphasis',
	'Underline',
	'UnderlineItalic',
	'Strikethrough',
	'InlineCode'
]
const tokenHidden = [
	'EmphasisMark',
	'UnderlineMark',
	'UnderlineItalicMark',
	'StrikethroughMark'
]
const decorationHidden = Decoration.mark({ class: 'cm-markdown-hidden' })
const decorationURL = Decoration.mark({ tagName: 'a' })
const decorationBlockquote = Decoration.mark({ class: 'cm-markdown-blockquote' })
const decorationTaskMarker = Decoration.mark({ class: 'cm-markdown-task-marker' })

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
			syntaxTree(view.state).iterate({ from, to, enter(node) {
				const inSelection = checkSelection(view.state, cursor, node) && view.hasFocus

				if (node.name === 'URL')
					decorations.push(decorationURL.range(node.from, node.to))

				if (inSelection && (node.name.startsWith('ATXHeading') || tokenElement.includes(node.name)))
					return false

				const text = view.state.doc.sliceString(node.from, node.to)

				if (node.name === 'HeaderMark')
					decorations.push(decorationHidden.range(node.from, node.to + 1))

				if (node.name === 'CodeMark' && text.length === 1)
					decorations.push(decorationHidden.range(node.from, node.to))

				if (tokenHidden.includes(node.name))
					decorations.push(decorationHidden.range(node.from, node.to))
			} })
		})

		return Decoration.set(decorations)
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
		wrapper.setAttribute('aria-hidden', 'true')
		wrapper.appendChild(checkbox)

		return wrapper
	}

	override ignoreEvent() {
		return false
	}
}

export function replaceSpecial() {
	return StateField.define<DecorationSet>({
		create(state) {
			return RangeSet.of(replaceSpecialWidgets(state), true)
		},
		update(decorations, transaction) {
			// TODO: use decorations.update
			return RangeSet.of(replaceSpecialWidgets(transaction.state), true)
		},
		provide(field) {
			return EditorView.decorations.from(field)
		}
	})
}

function replaceSpecialWidgets(state: EditorState, from?: number, to?: number) {
	const decorations: Range<Decoration>[] = []
	const [cursor] = state.selection.ranges

	syntaxTree(state).iterate({ from, to, enter(node) {
		if (![
			'TaskMarker',
			'Blockquote'
		].includes(node.name))
			return

		if (node.name === 'TaskMarker') {
			decorations.push(decorationTaskMarker.range(node.from + 1, node.to - 1))

			if (checkSelection(state, cursor, { ...node, from: node.from - 2 }))
				return false

			const text = state.doc.sliceString(node.from, node.to)

			decorations.push(Decoration.widget({
				widget: new RenderCheckboxWidget(text)
			}).range(node.from))
			decorations.push(decorationHidden.range(node.from, node.to))
			decorations.push(decorationHidden.range(node.from - 2, node.from))

			return
		} else if (checkSelection(state, cursor, node))
			return false

		switch (node.name) {
			case 'Blockquote':
				decorations.push(decorationBlockquote.range(node.from, node.to))
				break
		}
	}	})

	return decorations
}

function cursorIsExactlyOn(state: EditorState, cursor: SelectionRange, node: SyntaxNodeRef) {
	return ((cursor.to >= node.from && cursor.to <= node.to)
		|| (cursor.from >= node.from && cursor.from <= node.to))
}

function checkSelection(state: EditorState, cursor: SelectionRange, node: SyntaxNodeRef) {
	return (cursorIsExactlyOn(state, cursor, node)
		|| (cursor.to >= node.to && cursor.from <= node.from))
}
