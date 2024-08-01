import type { EditorView } from '@codemirror/view'
import { ViewPlugin, highlightSpecialChars } from '@codemirror/view'
import { languages } from '@codemirror/language-data'
import { RichEditPlugin } from './richEdit'
import { Strikethrough, TaskList, Underline, UnderlineItalic } from './extension'
import theme from './theme'
import { markdown, markdownLanguage } from './lang-markdown'

export function markdownViewPlugin() {
	return ViewPlugin.fromClass(RichEditPlugin, {
		decorations: v => v.decorations,
		provide: () => [
			theme,
			markdown({
				base: markdownLanguage,
				codeLanguages: languages,
				extensions: [
					TaskList,
					Underline,
					UnderlineItalic,
					Strikethrough
				]
			}),
			highlightSpecialChars()
		],
		eventHandlers: {
			mousedown({ target }) {
				if (target instanceof HTMLInputElement && target.matches('.cm-markdown-checkbox *'))
					return true
			},
			click({ target }, view) {
				if (target instanceof HTMLInputElement && target.matches('.cm-markdown-checkbox *'))
					return toggleCheckbox(view, view.posAtDOM(target))
			}
		}
	})
}

function toggleCheckbox(view: EditorView, pos: number) {
	const checked = view.state.doc.sliceString(pos - 2, pos - 1).toLowerCase() === 'x'
	const line = view.state.doc.lineAt(pos)

	view.dispatch({
		changes: {
			from: pos - 2,
			to: pos - 1,
			insert: checked ? ' ' : 'x'
		},
		selection: { anchor: line.to }
	})

	return true
}
