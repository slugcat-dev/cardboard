<script setup lang="ts">
import { convert, getMouseEventCaretRange } from '~/utils'

const props = defineProps(['card'])
const emit = defineEmits(['contentUpdate'])
const { card } = props
const textRef = ref()
const { shiftKey } = useKeys()

function activate(event: PointerEvent | MouseEvent) {
	textRef.value.contentEditable = true

	textRef.value.focus()

	if (!isEmpty())
		selectRange(getMouseEventCaretRange(event))
}

// Highlight "todo" in text cards
function onInput() {
	const content = textRef.value.innerHTML

	if (!content.match(/^todo:?(?:&nbsp;|\s)$/i))
		return

	const regex = /todo:?/gim
	let match

	// eslint-disable-next-line no-cond-assign
	while ((match = regex.exec(content)) !== null) {
		const selection = window.getSelection()
		const prevRange = selection?.getRangeAt(0).cloneRange()
		const hiliteRange = document.createRange()

		hiliteRange.setStart(textRef.value.firstChild, match.index)
		hiliteRange.setEnd(textRef.value.firstChild, match[0].length)
		selectRange(hiliteRange)
		document.execCommand('styleWithCSS', false, 'true')
		document.execCommand('foreColor', false, 'black')
		document.execCommand('hiliteColor', false, '#ffaa00')
		document.execCommand('bold', false)
		selectRange(prevRange)
	}
}

function onBlur() {
	if (!textRef.value)
		return emit('contentUpdate', true)

	textRef.value.contentEditable = false
	card.content = textRef.value.innerHTML

	emit('contentUpdate', true, isEmpty())
}

async function onPaste(event: ClipboardEvent) {
	event.preventDefault()

	const clipboardItems = event.clipboardData?.items
	const clipboardText = event.clipboardData?.getData('text/plain')
	let imageData

	for (const item of clipboardItems || []) {
		if (!item.type.includes('image'))
			continue

		const image = item.getAsFile()
		imageData = await blobToBase64(image)

		break
	}

	if (imageData && isEmpty()) {
		card.type = 'image'

		document.execCommand('insertText', false, imageData)
		textRef.value.blur()

		return
	}

	if (!shiftKey.value && isEmpty() && /^https?:\/\/\S+?\.\S+$/gi.test(clipboardText || '')) {
		document.execCommand('insertText', false, clipboardText)

		try {
			new URL(clipboardText || '').toString()

			textRef.value.blur()

			return
		}
		catch {}
	}

	document.execCommand('insertText', false, clipboardText)
}

function selectRange(range: Range | undefined) {
	if (!range)
		return

	const selection = window.getSelection()

	selection?.removeAllRanges()
	selection?.addRange(range)
}

function isEmpty() {
	return textRef.value.textContent.trim().length === 0
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

defineExpose({ activate })
</script>

<template>
	<div
		ref="textRef"
		class="card-text"
		contenteditable="false"
		spellcheck="false"
		@keydown.enter.exact="textRef.blur"
		@keydown.escape="textRef.blur"
		@keydown.delete="() => { if (isEmpty()) textRef.blur() }"
		@input="onInput"
		@blur="onBlur"
		@paste="onPaste"
		v-html="card.content"
	/>
</template>

<style>
.card-text {
	min-height: 2.125rem;
	padding: calc(.5rem - 1px);
	font-size: .875rem;
	outline: none;
}
</style>
