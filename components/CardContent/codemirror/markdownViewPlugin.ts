import type { EditorView } from '@codemirror/view'
import { ViewPlugin, highlightSpecialChars } from '@codemirror/view'
import { languages } from '@codemirror/language-data'
import { RichEditPlugin, replaceSpecial } from './richEdit'
import { Underline, UnderlineItalic } from './underline'
import theme from './theme'
import { markdown, markdownLanguage } from './lang-markdown'

export function markdownViewPlugin() {
	return ViewPlugin.fromClass(RichEditPlugin, {
		decorations: v => v.decorations,
		provide: () => [
			theme,
			replaceSpecial(),
			markdown({
				base: markdownLanguage,
				codeLanguages: languages,
				extensions: [Underline, UnderlineItalic]
			}),
			highlightSpecialChars()
		],
		eventHandlers: {
			mousedown({ target }) {
				if (target instanceof HTMLAnchorElement)
					return true

				if (target instanceof HTMLInputElement && target.matches('.cm-markdown-checkbox *'))
					return true
			},
			click({ target }, view) {
				if (target instanceof HTMLAnchorElement)
					return openLink(target)

				if (target instanceof HTMLInputElement && target.matches('.cm-markdown-checkbox *'))
					return toggleCheckbox(view, view.posAtDOM(target))
			}
		}
	})
}

function openLink(target) {
	const link = target.textContent

	window.open(link, '_blank')
}

function toggleCheckbox(view: EditorView, pos: number) {
	const checked = view.state.doc.sliceString(pos + 1, pos + 2).toLowerCase() === 'x'
	const line = view.state.doc.lineAt(pos)

	view.dispatch({
		changes: {
			from: pos + 1,
			to: pos + 2,
			insert: checked ? ' ' : 'x'
		},
		selection: { anchor: line.to }
	})

	return true
}
