<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
// TODO: clean up
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, drawSelection, dropCursor, highlightSpecialChars, highlightTrailingWhitespace, highlightWhitespace, keymap, rectangularSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { vim } from '@replit/codemirror-vim'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching, defaultHighlightStyle, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'

const { card } = defineProps(['card'])
const emit = defineEmits(['activate'])
const contentRef = ref()
const active = ref(false)
const editable = new Compartment()

let editor: EditorView

onMounted(() => {
	editor = new EditorView({
		doc: card.content,
		extensions: [
			// vim(),

			bracketMatching(),
			closeBrackets(),
			drawSelection(),
			dropCursor(),
			highlightTrailingWhitespace(),
			// highlightWhitespace(),
			history(),

			indentOnInput(),
			highlightSpecialChars(),

			EditorState.allowMultipleSelections.of(true),

			syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

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

			markdown({
				base: markdownLanguage,
				codeLanguages: languages
			}),

			editable.of(EditorView.editable.of(false))
		],
		parent: contentRef.value
	})

	editor.contentDOM.addEventListener('blur', onBlur)

	// Activate new cards
	if (card.id === 'new:empty')
		activate()
})

onBeforeUnmount(() => {
	editor.contentDOM.removeEventListener('blur', onBlur)
	editor.destroy()
})

function onKeyDownDel() {
	if (isEmpty())
		editor.contentDOM.blur()
}

function onKeyDownEsc(event: KeyboardEvent) {
	// Prevent navigation
	event.stopPropagation()
	editor.contentDOM.blur()
}

function activate() {
	if (active.value)
		return

	active.value = true

	editor.dispatch({
		effects: editable.reconfigure(EditorView.editable.of(true))
	})
	editor.focus()
	emit('activate')
}

async function onBlur() {
	active.value = false

	editor.dispatch({
		effects: editable.reconfigure(EditorView.editable.of(false)),
		selection: { anchor: 0 }
	})

	// Delete empty cards
	if (isEmpty())
		return fetchDeleteCard(card)

	card.content = editor.state.doc.toString()

	fetchUpdateCard(card)
}

function isEmpty() {
	return editor.state.doc.toString().trim().length === 0
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
  padding: 0 !important;
}

.cm-selectionBackground {
	background-color: var(--color-accent-25) !important;
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

.ͼ5 {
	color: var(--color-text);
	opacity: .5;
}

.ͼ6 {
	text-decoration: none;
}

.ͼ7 {
	font-weight: bold;
	font-size: 1.125rem;
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

// more classes till n
</style>
