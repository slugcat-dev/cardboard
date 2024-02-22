<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
const { card } = defineProps(['card'])
const contentRef = ref()
const active = ref(false)

// Activate new cards
onMounted(() => {
	if (card.id === 'create')
		activate()
})

function onBlur(event?: Event) {
	if (event?.type !== 'blur')
		contentRef.value.blur()

	active.value = false
	contentRef.value.contentEditable = false

	// Delete empty cards
	if (isEmpty())
		return // TODO

	card.content = contentRef.value.innerHTML

	updateCard(card)
}

function onKeyDownDel() {
	if (isEmpty())
		onBlur()
}

function activate(event?: MouseEvent) {
	if (active.value)
		return

	active.value = true
	contentRef.value.contentEditable = true
	contentRef.value.focus()

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
		class="card-content"
		contenteditable="false"
		spellcheck="false"
		@click.left.exact="activate"
		@blur="onBlur"
		@keydown.escape="onBlur"
		@keydown.delete="onKeyDownDel"
		v-html="card.content"
	/>
</template>

<style lang="scss">
.card-content {
	display: block;
	min-height: 2.5rem;
	padding: .5rem;
	background-color: #222;
	border: 2px solid var(--color-border);
	border-radius: .25rem;
	transition: color .2s;

	&:focus-visible {
		border-color: var(--color-accent);
		outline: none;
	}
}

.card.selected > .card-content {
	border-color: var(--color-accent-50);
}
</style>
