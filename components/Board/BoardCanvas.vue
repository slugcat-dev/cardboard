<script setup lang="ts">
import type CardComponent from './Card.vue'
import { suppressNextClick } from '~/utils'

const settings = useSettings()
const canvasRef = ref()
// Create a non-reactive copy of the board that doesn't update instantly
// because we want to use page transitions
const { board: boardRef, createBoard } = await useBoards()
const board = ref(boardRef.value)
const cardRefs: Ref<InstanceType<typeof CardComponent>[]> = ref([])
const { metaKey } = useKeys()
const selection = ref()
const selectionVisible = ref(false)
const pointerMoved = ref(false)
const zoom = ref(1)
let selectedCards: string[] = []
let pointerType: string
let pointerClickPos: Position
let prevScroll: Position
let prevActiveElement: Element | null
let pointerDown: boolean

defineShortcuts({
	'home': () => canvasRef.value.scrollTo({
		top: 0,
		left: 0
	}),
	'end': () => canvasRef.value.scrollTo({
		top: canvasRef.value.scrollHeight,
		left: canvasRef.value.scrollWidth
	}),
	// Select all cards
	'meta_a': () => {
		selection.value = new DOMRect(
			0,
			0,
			canvasRef.value.scrollWidth,
			canvasRef.value.scrollHeight
		)
	},
	// Delete all selected cards
	'shift_delete': async () => {
		if (selectedCards.length === 0)
			return

		// TODO: This is a bad idea, I can smell it
		// eslint-disable-next-line no-alert
		if (selectedCards.length === board.value.cards.length && !confirm('Are you sure you want to delete ALL cards on this board?'))
			return

		await $fetch(`/api/boards/${board.value.id}/cards/many`, {
			method: 'DELETE',
			body: selectedCards
		})

		selectedCards.forEach(id =>
			board.value.cards.splice(board.value.cards.findIndex(card => card.id === id), 1)
		)

		selectedCards = []
	},
	// Zoom
	'meta_+': () => zoomF(zoom.value * 1.2, {
		clientX: window.innerWidth / 2,
		clientY: window.innerHeight / 2
	}),
	'meta_-': () => zoomF(zoom.value * .8, {
		clientX: window.innerWidth / 2,
		clientY: window.innerHeight / 2
	})
})

function onPointerDown(event: PointerEvent) {
	// Save event data for following input events
	const canvasRect = canvasRef.value.getBoundingClientRect()

	pointerType = event.pointerType
	pointerClickPos = {
		x: event.clientX,
		y: event.clientY
	}
	prevScroll = {
		x: canvasRef.value.scrollLeft,
		y: canvasRef.value.scrollTop
	}
	prevActiveElement = document.activeElement

	if (pointerType === 'pen') {
		event.stopImmediatePropagation()
		event.preventDefault()
		event.stopPropagation()

		// eslint-disable-next-line no-alert
		return alert('Annotation is currently not supported')
	}

	if (event.target !== canvasRef.value)
		return

	if (metaKey.value) {
		selection.value = new DOMRect(
			pointerClickPos.x - canvasRect.left + canvasRef.value.scrollLeft,
			pointerClickPos.y - canvasRect.top + canvasRef.value.scrollTop
		)
		selectionVisible.value = true
	}

	pointerDown = true
}

// Pan the canvas when dragging with the mouse / select area
function onPointerMove(event: PointerEvent) {
	if (!pointerDown || pointerType !== 'mouse')
		return

	const dX = pointerClickPos.x - event.clientX
	const dY = pointerClickPos.y - event.clientY
	const pointerMoveThreshold = 4

	if (Math.abs(dX) > pointerMoveThreshold || Math.abs(dY) > pointerMoveThreshold) {
		pointerMoved.value = true

		if (selectionVisible.value) {
			const scrollDistance = {
				x: canvasRef.value.scrollLeft - prevScroll.x,
				y: canvasRef.value.scrollTop - prevScroll.y
			}

			selection.value = new DOMRect(
				selection.value.x,
				selection.value.y,
				scrollDistance.x - dX,
				scrollDistance.y - dY
			)
		}
		else {
			canvasRef.value.scroll({
				top: canvasRef.value.scrollTop - event.movementY,
				left: canvasRef.value.scrollLeft - event.movementX,
				behavior: 'instant'
			})
		}
	}
}

function onPointerUp() {
	// Suppress the following click event if the canvas was panned
	if (pointerMoved.value)
		suppressNextClick()

	pointerMoved.value = false
	selectionVisible.value = false
	pointerDown = false
}

// Zoom on touch enabled devices
let gesture = false
let initialTouches: TouchList
let initialZoom = 1
let prevTranslation: Position

function onTouchStart(event: TouchEvent) {
	gesture = event.touches.length === 2

	if (gesture) {
		event.preventDefault()

		initialTouches = event.touches
		initialZoom = zoom.value
		prevTranslation = { x: 0, y: 0 }
	}
}

function onTouchMove(event: TouchEvent) {
	if (!gesture)
		return

	event.preventDefault()

	const initialMidpoint = midpoint(initialTouches)
	const currentMidpoint = midpoint(event.touches)
	const transform = {
		scale: distance(event.touches) / distance(initialTouches),
		translation: {
			x: currentMidpoint.x - initialMidpoint.x,
			y: currentMidpoint.y - initialMidpoint.y
		},
		origin: initialMidpoint
	}
	const translationDelta = {
		x: transform.translation.x - prevTranslation.x,
		y: transform.translation.y - prevTranslation.y
	}

	zoomF(initialZoom * transform.scale, {
		clientX: transform.origin.x + transform.translation.x,
		clientY: transform.origin.y + transform.translation.y
	}, translationDelta)

	prevTranslation = transform.translation
}

function onTouchEnd() {
	gesture = false
}

function midpoint(touches: TouchList) {
	return {
		x: (touches[0].clientX + touches[1].clientX) / 2,
		y: (touches[0].clientY + touches[1].clientY) / 2
	}
}

function distance(touches: TouchList) {
	return Math.hypot(
		touches[1].clientX - touches[0].clientX,
		touches[1].clientY - touches[0].clientY
	)
}

// Create a new text card when you doubleclick or tap the canvas
async function onClick(event: MouseEvent) {
	if (event.target !== canvasRef.value)
		return

	clearSelection()

	// TODO: pointerType can be undefined
	// TODO: intercept click on android when tasklist is focused
	if (prevActiveElement?.className === 'card-text' || (pointerType === 'mouse' && event.detail < 2))
		return

	const position = getMousePos(event)

	if (metaKey.value) {
		const newBoard = await createBoard({ open: false, parent: board.value.id })
		const card = await $fetch<Card>(`/api/boards/${board.value.id}/cards`, {
			method: 'POST',
			body: {
				card: {
					type: 'board',
					created: new Date(),
					position,
					content: newBoard.id
				}
			}
		})

		board.value.cards.push(card)

		// Navigate to the new board
		setTimeout(async () => {
			const { push } = useBreadcrumbs()

			push.value = true

			await navigateTo(`/${newBoard.id}`)
		}, 400)
	}
	else {
		const data: Card = event.shiftKey
			? {
					id: 'create',
					type: 'tasklist',
					created: new Date(),
					position,
					content: {
						title: 'Tasklist',
						tasks: []
					}
				}
			: {
					id: 'create',
					type: 'text',
					created: new Date(),
					position,
					content: ''
				}
		const index = board.value.cards.push(data) - 1

		// Wait until the DOM has updated
		await nextTick()
		cardRefs.value[index].alignToGrid()
		cardRefs.value[index].activate(event)
	}
}

// Zoom using the mouse wheel
function onWheel(event: WheelEvent) {
	if (!event.ctrlKey && !event.metaKey)
		return

	event.preventDefault()

	zoomF(zoom.value + zoom.value * Math.sign(event.deltaY) * -.1, event)
}

// Drop images onto the board
const waiting = ref(false)

function onDrop(event: DragEvent) {
	const files = event.dataTransfer?.files

	if (files) {
		Array.prototype.forEach.call(files, async (file) => {
			if (!file.type.startsWith('image'))
				return

			waiting.value = true

			const data = await readDropFile(file)
			const card = await $fetch<Card>(`/api/boards/${board.value.id}/cards`, {
				method: 'POST',
				body: {
					card: {
						type: 'image',
						created: new Date(),
						position: getMousePos(event),
						content: data
					}
				}
			})

			waiting.value = false

			board.value.cards.push(card)
		})
	}

	event.preventDefault()
}

function readDropFile(file: File) {
	return new Promise<string>((resolve) => {
		const reader = new FileReader()

		reader.addEventListener('load', () => resolve(reader.result as string))
		reader.readAsDataURL(file)
	})
}

function onCardMove(id: string, prevPosition: Position, newPosition: Position) {
	if (selectedCards.length === 0)
		return

	const dX = newPosition.x - prevPosition.x
	const dY = newPosition.y - prevPosition.y

	selectedCards.filter(selected => selected !== id).forEach((selected) => {
		const index = board.value.cards.findIndex(card => card.id === selected)

		board.value.cards[index].position = {
			x: board.value.cards[index].position.x + dX,
			y: board.value.cards[index].position.y + dY
		}
	})
}

async function onCardUpdate(card: Card) {
	if (selectedCards.length === 0) {
		return await $fetch(`/api/boards/${board.value.id}/cards/${card.id}`, {
			method: 'PUT',
			body: card
		})
	}

	await $fetch(`/api/boards/${board.value.id}/cards/many`, {
		method: 'PUT',
		body: board.value.cards
			.filter(card => selectedCards.includes(card.id))
			.map((card) => {
				return {
					id: card.id,
					position: card.position
				}
			})
	})
}

async function onCardDelete(id: string) {
	if (id !== 'create')
		await $fetch(`/api/boards/${board.value.id}/cards/${id}`, { method: 'DELETE' })

	board.value.cards.splice(board.value.cards.findIndex(card => card.id === id), 1)
}

function onCardSelected(id: string, selected: boolean) {
	if (selected && !selectedCards.includes(id))
		selectedCards.push(id)
	else if (!selected && selectedCards.includes(id))
		selectedCards.splice(selectedCards.indexOf(id), 1)
}

function clearSelection() {
	selection.value = new DOMRect(-1, -1)
	selectedCards = []
}

function getMousePos(event: { clientX: number, clientY: number }) {
	const canvasRect = canvasRef.value.getBoundingClientRect()

	return {
		x: (canvasRef.value.scrollLeft + event.clientX - canvasRect.left) / zoom.value,
		y: (canvasRef.value.scrollTop + event.clientY - canvasRect.top) / zoom.value
	}
}

// TODO: rename
function zoomF(v: number, event: { clientX: number, clientY: number }, translation: Position = { x: 0, y: 0 }) {
	const prevMousePos = getMousePos(event)

	zoom.value = v
	zoom.value = Math.max(Math.min(zoom.value, 2), .2)

	const mousePos = getMousePos(event)
	const dX = (prevMousePos.x - mousePos.x) * zoom.value
	const dY = (prevMousePos.y - mousePos.y) * zoom.value

	canvasRef.value.scrollTo({
		top: canvasRef.value.scrollTop + dY - translation.y,
		left: canvasRef.value.scrollLeft + dX - translation.x,
		behavior: 'instant'
	})
}

const areaSpacerStyle = computed(() => {
	if (!process.client)
		return

	const areaRect = new DOMRect()

	// Find the bottom-righ corner of the bottom-right-most card
	cardRefs.value.forEach((card) => {
		const cardRect = card.getSizeRect()

		areaRect.width = Math.max(areaRect.width, cardRect.left + cardRect.width)
		areaRect.height = Math.max(areaRect.height, cardRect.top + cardRect.height)
	})

	return {
		// Add padding of another times the viewport size to the canvas
		top: `${areaRect.height * zoom.value}px`,
		left: `${areaRect.width * zoom.value}px`,
		width: '100vw',
		height: '100vh'
	}
})

const selectionStyle = computed(() => {
	if (!selection.value)
		return { display: 'none' }

	return {
		top: `${selection.value.top}px`,
		left: `${selection.value.left}px`,
		width: `${Math.abs(selection.value.width)}px`,
		height: `${Math.abs(selection.value.height)}px`,
		opacity: selectionVisible.value ? 1 : 0
	}
})
</script>

<template>
	<main
		id="canvas"
		ref="canvasRef"
		:class="{ selecting: metaKey }"
		:style="{ cursor: pointerMoved && !selectionVisible ? 'move' : waiting ? 'progress' : 'default' }"
		@pointerdown.left="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
		@touchcancel="onTouchEnd"
		@click="onClick"
		@wheel="onWheel"
		@dragenter.prevent
		@dragover.prevent
		@drop="onDrop"
	>
		<div
			v-if="board.cards.length > 0"
			class="area-spacer"
			:style="areaSpacerStyle"
		/>
		<ClientOnly>
			<template #fallback>
				<div class="loading">
					<Icon name="svg-spinners:ring-resize" /> LOADING...
				</div>
			</template>
			<Card
				v-for="card in board.cards"
				ref="cardRefs"
				:key="card.created.toString()"
				:card="card"
				:canvas-ref="canvasRef"
				:selection="selection"
				:zoom="zoom"
				@card-move="onCardMove"
				@card-update="onCardUpdate"
				@card-delete="onCardDelete"
				@card-selected="onCardSelected"
				@selection-clear="clearSelection"
			/>
		</ClientOnly>
		<div
			class="selection"
			:style="selectionStyle"
		/>
		<ContextMenu />
	</main>
</template>

<style lang="scss">
.loading {
	display: flex;
	gap: .5rem;
	align-items: center;
	justify-content: center;
	height: 100%;
	font-weight: bold;
}

#canvas {
	position: absolute;
	grid-area: main;
	width: 100%;
	height: 100%;
	overflow: auto;
	background-attachment: local;
	user-select: none;
	touch-action: pan-x pan-y;
	scroll-behavior: smooth;

	.area-spacer {
		position: absolute;
		z-index: -1;
	}

	.selection {
		position: absolute;
		z-index: 1;
		background-color: var(--color-accent-25);
		border: 1px solid var(--color-accent);
		transition: opacity .2s;
		pointer-events: none;
	}
}
</style>
