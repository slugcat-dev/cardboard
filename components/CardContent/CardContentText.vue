<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
import { EditorView } from '@codemirror/view'
import { Compartment } from '@codemirror/state'
import editor from '../../codemirror/editor'

const { card } = defineProps(['card'])
const emit = defineEmits(['activate'])
const contentRef = ref()
const active = ref(false)
const editable = new Compartment()

let view: EditorView

onMounted(() => {
	view = editor(contentRef.value, card.content, [
		EditorView.updateListener.of((update) => {
			if (update.focusChanged && !update.view.hasFocus)
				onBlur()
		}),
		editable.of(EditorView.editable.of(false))
	])

	// Activate new cards
	if (card.id === 'new:empty') {
		activate()

		if (!isEmpty())
			view.dispatch({ selection: { anchor: view.state.doc.length } })
	}
})

onBeforeUnmount(() => {
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

function activate(event?: MouseEvent) {
	if (active.value || !cardTargetAllowed(['A'], event))
		return

	active.value = true

	view.dispatch({
		effects: editable.reconfigure(EditorView.editable.of(true))
	})
	view.focus()
	emit('activate')

	// Caret placement fix for mobile
	if (!isPointerCoarse() || !event || event.target instanceof HTMLInputElement)
		return

	const from = view.posAtCoords({ x: event.clientX, y: event.clientY })

	if (!from)
		return

	// Move to the nearest word boundary
	const { state } = view
	const line = state.doc.lineAt(from)
	const text = line.text

	let start = from - line.from
	let end = start

	while (start > 0 && !/\W/.test(text.charAt(start - 1))) start--
	while (end < text.length && !/\W/.test(text.charAt(end))) end++

	const wordStart = line.from + start
	const wordEnd = line.from + end

	const moveTo = (wordEnd - from <= from - wordStart) ? wordEnd : wordStart

	view.dispatch({
		selection: { anchor: moveTo },
		scrollIntoView: true
	})
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

async function onPaste(event: ClipboardEvent) {
	if (!isEmpty())
		return

	if (event.clipboardData) {
		await handleDataTransfer(event.clipboardData, card.position, card)
		event.preventDefault()
	}
}

function isEmpty() {
	return view.state.doc.toString().trim().length === 0
}

// Prevent text being selected with the mouse  on anchor elements to allow link dragging
function onMouseDown(event: MouseEvent) {
	if (event.target instanceof HTMLAnchorElement)
		event.stopPropagation()
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
		@paste.capture="onPaste"
		@mousedown.capture="onMouseDown"
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
</style>
