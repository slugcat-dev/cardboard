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
	overflow: auto;
	scroll-behavior: smooth;
	user-select: none;
	-webkit-user-select: none;

	&::-webkit-scrollbar {
		background-color: transparent;
		width: .75rem;
		height: .75rem;
	}

	&::-webkit-scrollbar-thumb {
		background-color: var(--color-scrollbar);
		background-clip: content-box;
		border: .25rem solid transparent;
		border-radius: .5rem;
	}

	&::-webkit-scrollbar-corner {
		display: none;
	}

	.area-spacer-grid {
		position: absolute;
		top: 0;
		left: 0;
		background-image: radial-gradient(circle, var(--grid-color) 1px, transparent 1px);
		z-index: -1;
	}

	.selection {
		position: absolute;
		background-color: var(--color-blue-40);
		border: 1px solid var(--color-blue);
		border-radius: .25rem;
		transition: opacity .2s;
		pointer-events: none;
	}
}
</style>

<template>
	<CanvasHeader />
	<ClientOnly>
		<template #fallback>
			<div class="loading">
				Loading...
			</div>
		</template>
		<div
			id="canvas"
			ref="canvasRef"
			:style="{ cursor: pointerMoved && !selectionVisible ? 'move' : 'default' }"
			@pointerdown.left="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointerleave="onPointerUp"
			@pointercancel="onPointerUp"
			@click="onClick"
		>
			<div
				v-if="cards.length > 0"
				class="area-spacer-grid"
				:style="areaSpacerStyle"
			/>
			<div
				class="selection"
				:style="selectionStyle"
			/>
			<Card
				v-for="card in cards"
				ref="cardRefs"
				:key="card.created.toString()"
				:card="card"
				:canvas-ref="canvasRef"
				:selection="selection"
				@card-move="onCardMove"
				@card-update="onCardUpdate"
				@card-delete="onCardDelete"
				@card-selected="onCardSelected"
				@selection-clear="clearSelection"
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
const selection = ref()
const selectionVisible = ref(false)
const pointerMoved = ref(false)
let selectedCards: string[] = []
let pointerType: string
let pointerClickPos: Position
let prevScroll: Position
let prevActiveElement: Element | null
let pointerDown: boolean

defineShortcuts({
	home: () => canvasRef.value.scrollTo({
		top: 0,
		left: 0
	}),
	end: () => {
		canvasRef.value.scrollTo({
			top: canvasRef.value.scrollHeight - 2 * window.innerHeight,
			left: canvasRef.value.scrollWidth - 2 * window.innerWidth
		})
	},
	// Select all cards
	meta_a: () => {
		selection.value = new DOMRect(
			0,
			0,
			canvasRef.value.scrollWidth,
			canvasRef.value.scrollHeight
		)
	},
	// Delete all selected cards
	shift_delete: async () => {
		if (selectedCards.length === 0)
			return

		// TODO: This is a bad idea, I can smell it
		// eslint-disable-next-line no-alert
		if (selectedCards.length === cards.value.length && !confirm('Are you sure you want to delete ALL cards on this board?'))
			return

		await $fetch('/api/cards/many', {
			method: 'DELETE',
			query: { board: route.params.board },
			body: selectedCards
		})

		selectedCards.forEach(_id =>
			cards.value.splice(cards.value.findIndex(card => card._id === _id), 1)
		)

		selectedCards = []
	}
})

// Fetch cards
const { data } = await useFetch(`/api/boards/${route.params.board}`, { method: 'GET' })

cards.value = data.value?.cards as Card[]

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

// Create a new text card when you doubleclick or tap the canvas
async function onClick(event: MouseEvent) {
	if (event.target !== canvasRef.value)
		return

	clearSelection()

	if (prevActiveElement?.className === 'card-text' || (pointerType === 'mouse' && event.detail < 2))
		return

	const canvasRect = canvasRef.value.getBoundingClientRect()

	const index = cards.value.push({
		_id: 'create',
		type: 'text',
		created: new Date(),
		position: {
			x: canvasRef.value.scrollLeft + event.clientX - canvasRect.left,
			y: canvasRef.value.scrollTop + event.clientY - canvasRect.top
		},
		content: ''
	}) - 1

	// Wait until the DOM has updated
	await nextTick()
	cardRefs.value[index].activate(event)
}

function onCardMove(_id: string, prevPosition: Position, newPosition: Position) {
	if (selectedCards.length === 0)
		return

	const dX = newPosition.x - prevPosition.x
	const dY = newPosition.y - prevPosition.y

	selectedCards.filter(selected => selected !== _id).forEach((selected) => {
		const index = cards.value.findIndex(card => card._id === selected)

		cards.value[index].position = {
			x: cards.value[index].position.x + dX,
			y: cards.value[index].position.y + dY
		}
	})
}

async function onCardUpdate(card: Card) {
	if (selectedCards.length === 0) {
		return await $fetch(`/api/cards/${card._id}`, {
			method: 'PUT',
			body: card
		})
	}

	await $fetch(`/api/cards/many`, {
		method: 'PUT',
		body: cards.value
			.filter(card => selectedCards.includes(card._id))
			.map((card) => {
				return {
					_id: card._id,
					position: card.position
				}
			})
	})
}

async function onCardDelete(_id: string) {
	if (_id !== 'create') {
		await $fetch(`/api/cards/${_id}`, {
			method: 'DELETE',
			query: { board: route.params.board }
		})
	}

	cards.value.splice(cards.value.findIndex(card => card._id === _id), 1)
}

function onCardSelected(_id: string, selected: boolean) {
	if (selected && !selectedCards.includes(_id))
		selectedCards.push(_id)
	else if (!selected && selectedCards.includes(_id))
		selectedCards.splice(selectedCards.indexOf(_id), 1)
}

function clearSelection() {
	selection.value = new DOMRect(-1, -1)
	selectedCards = []
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
		'width': `calc(100vw + ${areaRect.width}px)`,
		'height': `calc(100vh + ${areaRect.height}px)`,

		// Grid background
		'background-size': `${settings.grid.size}px ${settings.grid.size}px`,
		'--grid-color': settings.grid.show ? `var(--color-scrollbar)` : 'transparent'
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
