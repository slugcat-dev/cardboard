// https://github.com/codemirror/view/blob/main/src/draw-selection.ts

import type { Extension } from '@codemirror/state'
import { EditorSelection, Prec } from '@codemirror/state'
import { EditorView, RectangleMarker, layer } from '@codemirror/view'
import type { StyleSpec } from 'style-mod'

const isSafari = import.meta.client && /Apple Computer/.test(navigator.vendor)
const isMobileSafari = import.meta.client && isSafari && (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2)
const canHidePrimary = !isMobileSafari

const cursorLayer = layer({
	above: true,

	markers(view) {
		const { state } = view
		const cursors = []

		for (const r of state.selection.ranges) {
			const prim = r === state.selection.main

			if (r.empty ? !prim || canHidePrimary : true) {
				const className = prim ? 'cm-cursor cm-cursor-primary' : 'cm-cursor cm-cursor-secondary'
				const cursor = r.empty ? r : EditorSelection.cursor(r.head, r.head > r.anchor ? -1 : 1)

				for (const piece of RectangleMarker.forRange(view, className, cursor))
					cursors.push(piece)
			}
		}

		return cursors
	},

	update(update, dom) {
		if (update.transactions.some(tr => tr.selection))
			dom.style.animationName = dom.style.animationName === 'cm-blink' ? 'cm-blink2' : 'cm-blink'

		return update.docChanged || update.selectionSet
	},

	mount(dom) {
		dom.style.animationDuration = '1000ms'
	},

	class: 'cm-cursorLayer'
})

const themeSpec: { [selector: string]: StyleSpec } = {
	'.cm-line': {
		caretColor: canHidePrimary ? 'transparent !important' : 'var(--color-accent) !important'
	},
	'.cm-content': {
		caretColor: canHidePrimary ? 'transparent !important' : 'var(--color-accent) !important'
	}
}

const hideNativeSelection = Prec.highest(EditorView.theme(themeSpec))

export function drawCursor(): Extension {
	return [cursorLayer, hideNativeSelection]
}
