<script setup lang="ts">
import { CardContentBoard, CardContentImage, CardContentLink, CardContentTaskList, CardContentText } from '#components'
import { convert, suppressNextClick } from '~/utils'

const props = defineProps([
	'card',
	'canvasRef',
	'gridSize',
	'selection',
	'zoom'
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
const { metaKey } = useKeys()
const selected = ref(false)
const contentActive = ref(false)
const pointerDown = ref(false)
let pointerType: string
let pointerClickPos: Position
let pointerOffset: Position
let cachedPointerEvent: PointerEvent | WheelEvent
let pointerMoved: boolean
let canvasListenerAdded = false
let longPressTimer: ReturnType<typeof setTimeout>

function getCardComponentType() {
	switch (card.type) {
		case 'text': return CardContentText
		case 'image': return CardContentImage
		case 'link': return CardContentLink
		case 'tasklist': return CardContentTaskList
		case 'board': return CardContentBoard
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

watch(selected, () => emit('cardSelected', card.id, selected.value))

function onPointerDown(event: PointerEvent) {
	if (isInteractable(event.target))
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

const edgeScroll = { top: 0, left: 0 }

function onPointerMove(event: PointerEvent | WheelEvent) {
	if (!pointerDown.value)
		return

	cachedPointerEvent = event

	const dX = Math.abs(pointerClickPos.x - event.clientX)
	const dY = Math.abs(pointerClickPos.y - event.clientY)
	const pointerMoveThreshold = window.matchMedia('(pointer: coarse)').matches ? 10 : 4

	if (!(dX > pointerMoveThreshold || dY > pointerMoveThreshold || pointerMoved))
		return

	pointerMoved = true

	if (!selected.value)
		emit('selectionClear')

	cancleLongPress()

	const prevPosition = card.position

	// Scroll the canvas when approaching an edge
	const canvasRect = props.canvasRef.getBoundingClientRect()

	if (event.clientX > canvasRect.left + props.canvasRef.clientWidth - 100)
		edgeScroll.left = 1

	if (event.clientX < canvasRect.left + 100)
		edgeScroll.left = -1

	if (event.clientY > canvasRect.top + props.canvasRef.clientHeight - 100)
		edgeScroll.top = 1

	if (event.clientY < canvasRect.top + 100)
		edgeScroll.top = -1

	card.position = {
		x: Math.max((props.canvasRef.scrollLeft + event.clientX - pointerOffset.x) / props.zoom, 0),
		y: Math.max((props.canvasRef.scrollTop + event.clientY - pointerOffset.y) / props.zoom, 0)
	}

	emit('cardMove', card.id, prevPosition, card.position)
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

function onClick(event: MouseEvent) {
	if (isInteractable(event.target) || pointerMoved)
		return

	if (metaKey.value)
		selected.value = !selected.value
	else if (card.type !== 'tasklist')
		activate(event)
}

function onContextMenu(event: MouseEvent) {
	emit('selectionClear')

	if (isInteractable(event.target) || pointerMoved)
		return

	event.preventDefault()

	if (event.shiftKey)
		return deleteCard()

	const typeSpecificEntries: ContextMenuEntry[] = []

	switch (card.type) {
		case 'text':
			typeSpecificEntries.push({
				name: 'Copy Text',
				handler: () => navigator.clipboard.writeText(card.content)
			})
			break
		case 'image':
			typeSpecificEntries.push(
				{
					name: 'View Image',
					handler: () => {}
				},
				{
					name: 'Copy Image',
					handler: async () => navigator.clipboard.write([new ClipboardItem({ 'image/png': (await fetch(card.content)).blob() })])
				}
			)
			break
		case 'link':
			typeSpecificEntries.push(
				{
					name: 'Open Link in New Tab',
					handler: () => navigateTo(card.content.url, { external: true, open: { target: '_blank' } })
				},
				{
					name: 'Copy Link Address',
					handler: () => navigator.clipboard.writeText(card.content.url)
				}
			)
			break
		case 'board':
			typeSpecificEntries.push({
				name: 'Open',
				handler: () => {
					const { push } = useBreadcrumbs()

					push.value = true

					return navigateTo(`/${card.content}`)
				}
			})
			break
	}

	if (card.type !== 'board') {
		typeSpecificEntries.push({
			name: 'Delete',
			handler: deleteCard,
			role: 'danger'
		})
	}

	useContextMenu().show({
		position: {
			x: event.clientX,
			y: event.clientY
		},
		entries: typeSpecificEntries
	})
}

// Move cards while scrolling the canvas
function onWheel(event: WheelEvent) {
	cachedPointerEvent = event

	if (canvasListenerAdded)
		return

	// Updating the card position only when the wheel event is fired is not enough
	// because browsers usually implement smooth scrolling
	const updPos = () => onPointerMove(cachedPointerEvent)

	props.canvasRef.addEventListener('scroll', updPos, { passive: true })
	props.canvasRef.addEventListener('scrollend', () => {
		props.canvasRef.removeEventListener('scroll', updPos)

		canvasListenerAdded = false
	}, { once: true })

	canvasListenerAdded = true
}

function onContentUpdate(fetch?: boolean, empty?: boolean) {
	contentActive.value = false

	if (empty)
		return deleteCard()

	if (fetch)
		updateCard(true)
}

// Workaround for the contextmenu event which is not implemented in iOS Safari
function startLongPress(event: PointerEvent) {
	cancleLongPress()

	if (!(navigator.vendor.includes('Apple') && 'ontouchstart' in window))
		return

	longPressTimer = setTimeout(() => {
		event.target?.dispatchEvent(new MouseEvent('contextmenu', {
			bubbles: true,
			cancelable: true,
			view: window,
			clientX: event.clientX,
			clientY: event.clientY
		}))
	}, 500)
}

function cancleLongPress() {
	clearTimeout(longPressTimer)
}

async function updateCard(contentChanged: boolean = false) {
	if (contentChanged) {
		if (card.type === 'text' && /^(?!.*<br>)https?:\/\/.+?\.\S+$/gi.test(card.content)) {
			const origContent = card.content

			card.content = '<span class="text-secondary">One sec...</span>'

			const converted = await convert({ ...card, content: origContent })

			card.type = converted.type
			card.content = converted.content
		}
	}

	alignToGrid()

	// Create or update card
	if (card.id === 'create') {
		delete card.id

		const data = await $fetch<Card>(`/api/boards/${route.params.board}/cards`, {
			method: 'POST',
			body: { card }
		})

		card.id = data.id
	}
	else
		emit('cardUpdate', card)
}

function isInteractable(target: EventTarget | null) {
	if (!target || !(target as Element).tagName)
		return false

	// TODO:
	return ['A', 'BUTTON', 'INPUT'].includes((target as Element).tagName) || contentActive.value || (target as HTMLDivElement).contentEditable === 'plaintext-only'
}

function activate(event: PointerEvent | MouseEvent) {
	event.preventDefault()

	emit('selectionClear')

	if (!('activate' in contentRef.value))
		return

	if (card.type !== 'tasklist')
		contentActive.value = true

	contentRef.value.activate(event)
}

async function deleteCard() {
	await nextTick()
	cardRef.value.classList.add('delete')
	setTimeout(() => emit('cardDelete', card.id), 200)
}

function alignToGrid() {
	const gridSize = settings.value.grid.snap ? settings.value.grid.size : 1
	const prevPosition = card.position

	card.position = {
		x: Math.round(card.position.x / gridSize) * gridSize,
		y: Math.round(card.position.y / gridSize) * gridSize
	}

	emit('cardMove', card.id, prevPosition, card.position)
}

function getSizeRect() {
	const cardRect = cardRef.value.getBoundingClientRect()

	cardRect.x = card.position.x
	cardRect.y = card.position.y

	return cardRect
}

defineExpose({ activate, alignToGrid, getSizeRect })
</script>

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
			top: `${card.position.y * zoom}px`,
			left: `${card.position.x * zoom}px`,
			scale: zoom
		}"
		@pointerdown.left="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"
		@click="onClick"
		@contextmenu="onContextMenu"
		@wheel="onWheel"
	>
		<component
			:is="getCardComponentType()"
			ref="contentRef"
			:card="card"
			@content-update="onContentUpdate"
		/>
	</div>
</template>

<style lang="scss">
.card {
	position: absolute;
	width: max-content;
	background-color: var(--color-background-secondary);
	border: 1px solid var(--color-border);
	border-radius: .25rem;
	box-shadow: var(--shadow-card);
	transform-origin: top left;
	cursor: grab;
	touch-action: none;

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
			position: fixed;
			display: block;
			content: '';
			inset: -50vh -50vw;
		}
	}

	&.selected {
		border: 1px solid var(--color-accent-50);
		box-shadow: 0 0 0 1px var(--color-accent-50);
	}

	&:has(.card-text:focus-visible) {
		border: 1px solid var(--color-accent);
		box-shadow: 0 0 0 1px var(--color-accent);
	}

	&:not(:has(.card-text[contenteditable="true"])),
	& :not(.card-text[contenteditable="true"]) {
		user-select: none;
	}

	&.delete {
		/* Can't use transform-origin: center here */
		transform: scale(.75) translate(calc(25% / 2), calc(25% / 2));
		opacity: 0;
		transition: .1s;
	}
}

.selecting > .card {
	cursor: default
}
</style>
