<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
const { card } = defineProps(['card'])
const emit = defineEmits(['activate'])
const contentRef = ref()
const active = ref(false)

// Activate new cards
if (card.id === 'create')
	onMounted(activate)

async function onBlur(event?: Event) {
	if (event?.type !== 'blur')
		return contentRef.value.blur()

	active.value = false
	contentRef.value.contentEditable = false

	// Delete empty cards
	if (isEmpty())
		return fetchDeleteCard(card)

	card.content = contentRef.value.innerHTML

	fetchUpdateCard(card)
}

function onKeyDownDel() {
	if (isEmpty())
		onBlur()
}

// TODO ---
async function onPaste(event: ClipboardEvent) {
	if (!event.clipboardData)
		return

	const files = Array.from(event.clipboardData.files)

	if (files.length > 0) {
		event.preventDefault()

		if (!isEmpty() || !files[0].type.startsWith('image'))
			return

		const url = await blobToBase64(files[0])

		card.content = url
		card.type = 'image'

		fetchUpdateCard(card)

		// TODO: multiple files
		// TODO: other types than img
		// TODO: send this part of func to canvas paste handler instead and del card
	}
}

function blobToBase64(blob: Blob | null) {
	return new Promise((resolve: (result: string | null) => void) => {
		const reader = new FileReader()

		reader.onloadend = () => resolve(reader.result as string)

		if (blob)
			reader.readAsDataURL(blob)
		else
			resolve(null)
	})
}
// TODO ---

function activate(event?: MouseEvent) {
	if (active.value)
		return

	active.value = true
	contentRef.value.contentEditable = true

	contentRef.value.focus()
	emit('activate')

	if (event)
		moveCaretWhereClicked(event)
}

function moveCaretWhereClicked(event: MouseEvent | MouseEvent & { rangeOffset: number, rangeParent: Node }) {
	const range = (() => {
	// Firefox-only, not documented on MDN
		if ('rangeOffset' in event) {
			const range = document.createRange()

			range.setStart(event.rangeParent, event.rangeOffset)
			range.collapse(true)

			return range
		}

		// Deprecated in favor of caretPositionFromPoint, but supported by every browser except Firefox (which is the only to support the new method)
		return document.caretRangeFromPoint(event.clientX, event.clientY) ?? document.createRange()
	})()

	// Move the caret to the start or end of the clicked word
	if (isPointerCoarse()) {
		const text = range.startContainer.textContent || ''
		let start = range.startOffset
		let end = range.startOffset

		while (start > 0 && !/\s|\W/.test(text.charAt(start - 1))) start--
		while (end < text.length && !/\s|\W/.test(text.charAt(end))) end++

		range.setStart(range.startContainer, end - range.startOffset <= range.startOffset - start ? end : start)
		range.collapse(true)
	}

	selectRange(range)
}

function isEmpty() {
	return contentRef.value.textContent.trim().length === 0
}

defineExpose({ active })
</script>

<template>
	<div
		ref="contentRef"
		class="card-content-text"
		contenteditable="false"
		spellcheck="false"
		@click.left.exact="activate"
		@blur="onBlur"
		@keydown.escape="onBlur"
		@keydown.delete="onKeyDownDel"
		@paste="onPaste"
		v-html="card.content"
	/>
</template>

<style lang="scss">
.card-content-text {
	min-height: 2.25rem;
	padding: .375rem;
	font-size: .875rem;
	background-color: #222;
	border: 2px solid var(--color-border);
	border-radius: .375rem;
	box-shadow: var(--shadow-card);

	&:focus-visible {
		border-color: var(--color-accent);
		outline: none;
	}
}

.card.selected > .card-content-text {
	border-color: var(--color-accent-50);
}
</style>
