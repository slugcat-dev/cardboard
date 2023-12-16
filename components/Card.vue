<style lang="scss">
.card {
	position: absolute;
	width: max-content;
	background-color: var(--color-card-background);
	border: 1px solid var(--color-card-border);
	border-radius: .25rem;
	box-shadow: var(--shadow-card);
	touch-action: none;
	cursor: grab;

	&.content-active {
		cursor: auto;
	}

	&:hover,
	&.selected {
		z-index: 1;
	}

	&.pointer-down,
	&:has(.card-text:focus-visible) {
		z-index: 2;
	}

	&.pointer-down {
		cursor: grabbing;

		&::before {
			content: '';
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			z-index: -1;
		}
	}

	&.selected,
	&:has(.card-text:focus-visible) {
		box-shadow: 0px 0px 0px 2px var(--color-blue-40);
	}

	&:has(.card-text:focus-visible) {
		border-color: var(--color-blue);
	}

	&:not(:has(.card-text[contenteditable="true"])),
	& :not(.card-text[contenteditable="true"]) {
		user-select: none;
		-webkit-user-select: none;
	}
}
</style>

<template>
	<div
		ref="cardRef"
		class="card"
		:class="{
			selected,
			'content-active': contentActive,
			'pointer-down': pointerDown
		}"
		:style="{
			top: `${card.position.y}px`,
			left: `${card.position.x}px`
		}"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"
		@touchmove="onTouchMove"
		@click="onClick"
		@contextmenu="onContextMenu"
	>
		<component
			:is="getCardComponentType()"
			ref="contentRef"
			:card="card"
			@content-update="onContentUpdate"
			@contentUpdateConvertedTODORename="theCrackedThing"
		/>
	</div>
</template>

<script setup lang="ts">
import { CardContentImage, CardContentLink, CardContentTaskList, CardContentText } from '#components'
import { convert, suppressNextClick } from '~/utils'

const props = defineProps([
	'card',
	'canvasRef',
	'gridSize',
	'selection'
])
const emit = defineEmits([
	'cardMove',
	'cardUpdate',
	'cardDelete',
	'cardSelected',
	'selectionClear'
])
const {	card } = props
const route = useRoute()
const settings = useSettings()
const cardRef = ref()
const contentRef = ref()
const selected = ref(false)
const contentActive = ref(false)
const pointerDown = ref(false)
let pointerType: string
let pointerClickPos: Position
let pointerOffset: Position
let pointerMoved: boolean
let longPressTimer: ReturnType<typeof setTimeout>

function getCardComponentType() {
	switch (card.type) {
		case 'text': return CardContentText
		case 'image': return CardContentImage
		case 'link': return CardContentLink
		case 'tasklist': return CardContentTaskList
	}
}

watch(() => props.selection, () => {
	const cardRect = DOMRect.fromRect(cardRef.value.getBoundingClientRect())
	const canvasRect = props.canvasRef.getBoundingClientRect()

	cardRect.x = cardRect.x - canvasRect.left + props.canvasRef.scrollLeft
	cardRect.y = cardRect.y - canvasRect.top + props.canvasRef.scrollTop

	selected.value = !(
		props.selection.right < cardRect.left
		|| props.selection.left > cardRect.right
		|| props.selection.bottom < cardRect.top
		|| props.selection.top > cardRect.bottom
	)
})

watch(selected, () => emit('cardSelected', card._id, selected.value))

function onPointerDown(event: PointerEvent) {
	if (isInteractable(event.target) || contentActive.value)
		return

	pointerType = event.pointerType
	pointerClickPos = {
		x: event.clientX,
		y: event.clientY
	}

	startLongPress(event)

	// Save the offset between the pointer and the cards top left corner
	const cardRect = cardRef.value.getBoundingClientRect()
	const canvasRect = props.canvasRef.getBoundingClientRect()

	pointerOffset = {
		x: event.clientX - cardRect.left + canvasRect.left,
		y: event.clientY - cardRect.top + canvasRect.top
	}

	pointerDown.value = true
}

function onPointerMove(event: PointerEvent) {
	if (!pointerDown.value)
		return

	const dX = Math.abs(pointerClickPos.x - event.clientX)
	const dY = Math.abs(pointerClickPos.y - event.clientY)
	const pointerMoveThreshold = pointerType === 'touch' ? 10 : 4

	if (!(dX > pointerMoveThreshold || dY > pointerMoveThreshold || pointerMoved))
		return

	pointerMoved = true

	if (!selected.value)
		emit('selectionClear')

	cancleLongPress()

	const prevPosition = card.position

	card.position = {
		x: Math.max(props.canvasRef.scrollLeft + event.clientX - pointerOffset.x, 0),
		y: Math.max(props.canvasRef.scrollTop + event.clientY - pointerOffset.y, 0)
	}

	emit('cardMove', card._id, prevPosition, card.position)
}

function onPointerUp() {
	pointerDown.value = false

	cancleLongPress()

	if (pointerMoved) {
		pointerMoved = false

		if (pointerType === 'mouse')
			suppressNextClick()

		return updateCard()
	}
}

// Prevent scrolling when dragging the card
function onTouchMove(event: TouchEvent) {
	if (!contentActive.value)
		return event.preventDefault()
}

function onClick(event: MouseEvent) {
	if (isInteractable(event.target) || contentActive.value)
		return

	if (useShortcuts().macOS ? event.metaKey : event.ctrlKey)
		selected.value = !selected.value
	else
		activate(event)
}

// Delete card on right click
function onContextMenu(event: MouseEvent) {
	emit('selectionClear')

	if (isInteractable(event.target) || pointerMoved || contentActive.value)
		return

	event.preventDefault()
	deleteCard()
}

function onContentUpdate(fetch?: boolean, empty?: boolean) {
	contentActive.value = false

	if (empty)
		return deleteCard()

	if (fetch)
		updateCard()
}

function theCrackedThing(converted: any) {
	card.type = converted.type
	card.content = converted.content

	updateCard()
}

function startLongPress(event: PointerEvent) {
	cancleLongPress()

	longPressTimer = setTimeout(() => {
		// Workaround for the contextmenu event which is not implemented in iOS Safari
		if (navigator.vendor.includes('Apple') && 'ontouchstart' in window) {
			event.target?.dispatchEvent(new MouseEvent('contextmenu', {
				bubbles: true,
				cancelable: true,
				view: window
			}))

			suppressNextClick()
		}
	}, 500)
}

function cancleLongPress() {
	clearTimeout(longPressTimer)
}

async function updateCard() {
	if (card.type === 'text' && /^(?!.*<br>)https?:\/\/.+?\.\S+$/gi.test(card.content)) {
		const origContent = card.content

		card.content = '<span class="text-secondary">One sec...</span>'

		const converted = await convert({ ...card, content: origContent })

		card.type = converted.type
		card.content = converted.content
	}

	// Align to grid
	const gridSize = settings.grid.snap ? settings.grid.size : 1
	const prevPosition = card.position

	card.position = {
		x: Math.round(card.position.x / gridSize) * gridSize,
		y: Math.round(card.position.y / gridSize) * gridSize
	}

	emit('cardMove', card._id, prevPosition, card.position)

	// Create or update card
	if (card._id === 'create') {
		delete card._id

		const data = await $fetch('/api/cards/create', {
			method: 'POST',
			query: { board: route.params.board },
			body: card
		})

		card._id = data
	}
	else
		emit('cardUpdate', card)
}

function isInteractable(target: EventTarget | null) {
	if (!target || !(target as Element).tagName)
		return false

	return (target as Element).tagName === 'A'
}

function activate(event: PointerEvent | MouseEvent) {
	emit('selectionClear')

	if (!('activate' in contentRef.value))
		return

	contentActive.value = true

	contentRef.value.activate(event)
}

function deleteCard() {
	emit('cardDelete', card._id)
}

function getSizeRect() {
	const cardRect = cardRef.value.getBoundingClientRect()

	cardRect.x = card.position.x
	cardRect.y = card.position.y

	return cardRect
}

defineExpose({ activate, getSizeRect })
</script>
