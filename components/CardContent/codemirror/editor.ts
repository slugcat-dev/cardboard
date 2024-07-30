import { EditorView, drawSelection, dropCursor, keymap } from '@codemirror/view'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { indentOnInput } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { markdownViewPlugin } from './markdownViewPlugin'

let view: EditorView

export default function (element: Element, content: string, extensions: Extension[] = []) {
	view = new EditorView({
		doc: content,
		extensions: [
			markdownViewPlugin(),
			history(),
			drawSelection(),
			dropCursor(),
			indentOnInput(),
			closeBrackets(),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				indentWithTab
			]),
			...extensions
		],
		parent: element
	})

	return view
}
