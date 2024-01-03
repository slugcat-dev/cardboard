<style lang="scss">
.loading {
	display: flex;
	height: 100vh;
	justify-content: center;
	align-items: center;
	gap: 2rem;
	font-size: 2rem;
}

#canvas {
	position: relative;
	top: 2.875rem;
	height: calc(100vh - 2.875rem);
	background-attachment: local;
	overflow: auto;
	scroll-behavior: smooth;
	user-select: none;
	-webkit-user-select: none;

	.area-spacer {
		position: absolute;
		z-index: -1;
	}

	.selection {
		position: absolute;
		background-color: var(--color-accent-25);
		border: 1px solid var(--color-accent);
		transition: opacity .2s;
		pointer-events: none;
		z-index: 1;
	}
}
</style>

<template>
	<ClientOnly>
		<template #fallback>
			<div class="loading">
				Loading...
			</div>
		</template>
		<div
			id="canvas"
			ref="canvasRef"
			:class="{ selecting: metaKey }"
			:style="canvasStyle"
			@pointerdown.left="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointerleave="onPointerUp"
			@pointercancel="onPointerUp"
			@touchstart="onTouchStart"
			@touchmove="onTouchMove"
			@touchend="onTouchEnd"
			@touchcancel="onTouchCancle"
			@click="onClick"
			@wheel="onWheel"
		>
			<div
				v-if="cards.length > 0"
				class="area-spacer"
				:style="areaSpacerStyle"
			/>
			<Card
				v-for="card in cards"
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
			<div
				class="selection"
				:style="selectionStyle"
			/>
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type CardComponent from './Card.vue'
import { suppressNextClick } from '~/utils'

const route = useRoute()
const settings = useSettings()
const canvasRef = ref()
const cards: Ref<Card[]> = ref([])
const cardRefs: Ref<InstanceType<typeof CardComponent>[]> = ref([])
const { metaKey, shiftKey } = useKeys()
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
	'end': () => {
		canvasRef.value.scrollTo({
			top: canvasRef.value.scrollHeight - 2 * window.innerHeight,
			left: canvasRef.value.scrollWidth - 2 * window.innerWidth
		})
	},
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
		if (selectedCards.length === cards.value.length && !confirm('Are you sure you want to delete ALL cards on this board?'))
			return

		await $fetch('/api/cards/many', {
			method: 'DELETE',
			body: selectedCards
		})

		selectedCards.forEach(id =>
			cards.value.splice(cards.value.findIndex(card => card.id === id), 1)
		)

		selectedCards = []
	},
	// Zoom
	'meta_+': () => zoomF(1, {
		clientX: window.innerWidth / 2,
		clientY: window.innerHeight / 2
	}),
	'meta_-': () => zoomF(-1, {
		clientX: window.innerWidth / 2,
		clientY: window.innerHeight / 2
	})
})

// Fetch cards
const { data } = await useFetch(`/api/boards/${route.params.board}`, { method: 'GET' })
const board = data.value as Board

cards.value = board.cards as Card[]

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

	if (useShortcuts().macOS ? event.metaKey : event.ctrlKey) {
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

function onTouchStart(event: TouchEvent) {
	gesture = event.touches.length === 2
	initialTouches = event.touches
	initialZoom = zoom.value
}

function onTouchMove(event: TouchEvent) {
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

	zoomF((initialZoom - transform.scale) * -1, {
		clientX: transform.origin.x,
		clientY: transform.origin.y
	})
}

function onTouchEnd(event: TouchEvent) {
	gesture = event.touches.length === 2
}

function onTouchCancle(event: TouchEvent) {
	gesture = event.touches.length === 2
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

//

// Create a new text card when you doubleclick or tap the canvas
async function onClick(event: MouseEvent) {
	if (event.target !== canvasRef.value)
		return

	clearSelection()

	if (prevActiveElement?.className === 'card-text' || (pointerType === 'mouse' && event.detail < 2))
		return

	const position = getMousePos(event)

	if (metaKey.value) {
		const board = await $fetch('/api/boards', { method: 'POST' })
		const card = await $fetch('/api/cards', {
			method: 'POST',
			body: {
				board: route.params.board,
				card: {
					type: 'board',
					created: new Date(),
					position,
					content: board.id
				}
			}
		})

		cards.value.push(card)
	}
	else {
		const data: Card = shiftKey.value
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
		const index = cards.value.push(data) - 1

		// Wait until the DOM has updated
		await nextTick()
		cardRefs.value[index].alignToGrid()
		cardRefs.value[index].activate(event)
	}
}

// Zoom using the mouse wheel
function onWheel(event: WheelEvent) {
	if (!(useShortcuts().macOS ? event.metaKey : event.ctrlKey))
		return

	event.preventDefault()

	zoomF(Math.sign(event.deltaY) * -1, event)
}

function onCardMove(id: string, prevPosition: Position, newPosition: Position) {
	if (selectedCards.length === 0)
		return

	const dX = newPosition.x - prevPosition.x
	const dY = newPosition.y - prevPosition.y

	selectedCards.filter(selected => selected !== id).forEach((selected) => {
		const index = cards.value.findIndex(card => card.id === selected)

		cards.value[index].position = {
			x: cards.value[index].position.x + dX,
			y: cards.value[index].position.y + dY
		}
	})
}

async function onCardUpdate(card: Card) {
	if (selectedCards.length === 0) {
		return await $fetch(`/api/cards/${card.id}`, {
			method: 'PUT',
			body: card
		})
	}

	await $fetch(`/api/cards/many`, {
		method: 'PUT',
		body: cards.value
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
		await $fetch(`/api/cards/${id}`, { method: 'DELETE' })

	cards.value.splice(cards.value.findIndex(card => card.id === id), 1)
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

function zoomF(v: number, event: { clientX: number, clientY: number }) {
	const prevMousePos = getMousePos(event)
	
	zoom.value += v * .1
	zoom.value = Math.max(Math.min(zoom.value, 2), .25)

	const mousePos = getMousePos(event)
	const dX = prevMousePos.x - mousePos.x
	const dY = prevMousePos.y - mousePos.y

	canvasRef.value.scrollTo({
		top: canvasRef.value.scrollTop + dY * zoom.value,
		left: canvasRef.value.scrollLeft + dX * zoom.value,
		behavior: 'instant'
	})
}

const areaSpacerStyle = computed(() => {
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
		width: `${100 * zoom.value}vw`,
		height: `${100 * zoom.value}vh`
	}
})

const canvasStyle = computed(() => {
	const visualGridSize = settings.grid.size * zoom.value

	return {
		'--grid-color': settings.grid.show && zoom.value > .75 ? `var(--color-scrollbar)` : 'transparent',
		'background-image': `radial-gradient(circle, var(--grid-color) ${Math.max(1, zoom.value)}px, transparent ${Math.max(1, zoom.value)}px)`,
		'background-size': `${visualGridSize}px ${visualGridSize}px`,
		'cursor': pointerMoved.value && !selectionVisible.value ? 'move' : 'default'
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

