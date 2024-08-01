import { EditorView, dropCursor, keymap } from '@codemirror/view'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentLess, insertBlankLine, insertTab } from '@codemirror/commands'
import { indentOnInput, indentUnit } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { markdownViewPlugin } from './markdownViewPlugin'
import { drawCursor } from './drawCursor'

let view: EditorView

export default function (element: Element, content: string, extensions: Extension[] = []) {
	view = new EditorView({
		doc: content,
		extensions: [
			indentUnit.of('\t'),
			markdownViewPlugin(),
			history(),
			drawCursor(),
			dropCursor(),
			indentOnInput(),
			closeBrackets(),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				{ key: 'Tab', run: insertTab },
				{ key: 'Shift-Tab', run: indentLess },
				{ key: 'Shift-Enter', run: insertBlankLine }
			]),
			...extensions
		],
		parent: element
	})

	view.contentDOM.setAttribute('spellcheck', 'false')
	view.contentDOM.removeAttribute('autocorrect')
	view.contentDOM.removeAttribute('autocapitalize')

	return view
}
