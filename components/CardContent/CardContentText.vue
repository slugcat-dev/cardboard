<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
import { EditorView } from '@codemirror/view'
import { Compartment } from '@codemirror/state'
import editor from './codemirror/editor'

const { card } = defineProps(['card'])

const emit = defineEmits(['activate'])

const contentRef = ref()
const active = ref(false)
const editable = new Compartment()

let view: EditorView

onMounted(() => {
	view = editor(contentRef.value, card.content, [
		editable.of(EditorView.editable.of(false))
	])

	// https://codemirror.net/docs/ref/#view.EditorView^focusChangeEffect
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
</style>
