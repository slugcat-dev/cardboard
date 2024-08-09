<script setup lang="ts">
import { createCard } from '~/utils/cards.tmp'

const canvasRef = ref()
const pointer = reactive({
	type: 'unknown',
	down: false,
	downPos: { x: 0, y: 0 },
	pos: { x: 0, y: 0 },
	moved: false,
	gesture: false
})
const gesture = {
	initialTouches: [] as Touch[],
	initialZoom: 1,
	prevTranslation: { x: 0, y: 0 }
}
const canvas = reactive({
	ref: canvasRef,
	scroll: {
		x: 0,
		y: 0,
		smoothX: 0,
		smoothY: 0,
		velocity: { x: 0, y: 0 }
	},
	zoom: 1,
	smoothZoom: 1,
	select: false,
	cardDragAllowed: computed(() => !pointer.down && !pointer.gesture)
})
const selection = reactive({
	rect: process.client ? new DOMRect() : undefined,
	cards: [] as Card[],
	visible: false,
	clear() {
		selection.rect = undefined
		selection.cards = []
	}
})
const arrowKeys = {
	left: false,
	right: false,
	up: false,
	down: false
}
const {
	animateSmoothScroll,
	animateContinuousScroll,
	stopContinuousScroll,
	animateEdgeScroll,
	stopEdgeScroll
} = useSmoothScroll(canvas)
const {	board } = await useBoards()
const cards = ref(board.value.cards)
const animating = computed(() => (
	pointer.down
	|| pointer.gesture
	|| canvas.smoothZoom !== canvas.zoom
	|| canvas.scroll.smoothX !== canvas.scroll.x
	|| canvas.scroll.smoothY !== canvas.scroll.y
))
const gridSize = computed(() => {
	let value = 20 * canvas.smoothZoom

	// Adjust the grid density to the zoom level
	while (value <= 10) value *= 2
	while (value >= 30) value /= 2

	return value
})
let activeElement: Element | null

definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
onMounted(resetPointerPos)
defineHotkeys({
	'home': resetZoom,
	'end': overview,
	'meta +': keyboardZoom,
	'meta -': keyboardZoom,
	'meta a': () => selection.rect = new DOMRect(-Infinity, -Infinity, Infinity, Infinity),
	'space': () => createCard({ position: toCanvasPos(canvas, pointer.pos) }),
	'delete': deleteCards,
	'backspace': deleteCards
})

function resetZoom() {
	canvas.scroll.x = 0
	canvas.scroll.y = 0
	canvas.zoom = 1

	animateSmoothScroll(500)
}

// Zoom out to fit all cards into view
function overview() {
	const canvasRect = canvas.ref.getBoundingClientRect()
	const cardRefs = Array.from<HTMLElement>(canvas.ref.querySelectorAll('.card'))

	// Calculate the area occupied by all cards
	const rect = cardRefs.reduce<DOMRect | undefined>((rect, cardRef) => {
		const cardRect = toCanvasRect(canvas, cardRef.getBoundingClientRect())

		if (!rect)
			return cardRect

		const minX = Math.min(rect.x, cardRect.x)
		const minY = Math.min(rect.y, cardRect.y)
		const maxX = Math.max(rect.x + rect.width, cardRect.x + cardRect.width)
		const maxY = Math.max(rect.y + rect.height, cardRect.y + cardRect.height)

		return new DOMRect(minX, minY, maxX - minX, maxY - minY)
	}, undefined)

	if (!rect)
		return resetZoom()

	const scaleX = canvasRect.width / (rect.width + 100)
	const scaleY = canvasRect.height / (rect.height + 100)

	canvas.zoom = Math.max(Math.min(scaleX, scaleY, 1), .2)
	canvas.scroll.x = (canvasRect.width - rect.width * canvas.zoom) / 2 - rect.x * canvas.zoom
	canvas.scroll.y = (canvasRect.height - rect.height * canvas.zoom) / 2 - rect.y * canvas.zoom

	animateSmoothScroll(500)
}

function keyboardZoom(event: KeyboardEvent) {
	const delta = event.key === '+' ? -.2 : .2
	const canvasRect = canvas.ref.getBoundingClientRect()

	setCanvasZoom(canvas.zoom * (1 - delta), {
		x: canvasRect.x + canvasRect.width / 2,
		y: canvasRect.y + canvasRect.height / 2
	})
	animateSmoothScroll()
}

function deleteCards() {
	if (selection.cards.length === 0)
		return

	// eslint-disable-next-line no-alert
	if (!confirm(`Are you sure you want to delete ${selection.cards.length} cards?`))
		return

	fetchDeleteMany(selection.cards)
	selection.clear()
}

// Pan the canvas using the arrow keys
useEventListener(['keyup', 'keydown'], (event) => {
	const key = event.key.toLowerCase()

	if (!key.includes('arrow') || usingInput.value)
		return

	arrowKeys[key.substring(5) as 'left' | 'right' | 'up' | 'down'] = event.type === 'keydown'

	const direction = { x: 0, y: 0 }

	if (arrowKeys.left)
		direction.x += 1

	if (arrowKeys.right)
		direction.x -= 1

	if (arrowKeys.up)
		direction.y += 1

	if (arrowKeys.down)
		direction.y -= 1

	if (direction.x === 0 && direction.y === 0)
		return stopContinuousScroll()

	// Normalize direction so scrolling diagonally doesn't feel faster
	const magnitude = Math.hypot(direction.x, direction.y)

	direction.x = direction.x / magnitude
	direction.y = direction.y / magnitude

	animateContinuousScroll(direction, 1000)
})

// Listen for paste events on the entire document
useEventListener('paste', async (event: ClipboardEvent) => {
	if (!usingInput.value && event.clipboardData)
		await handleDataTransfer(event.clipboardData, toCanvasPos(canvas, pointer.pos))
})

// Update the selection rect on scroll
watch(canvas, () => updateSelectionRect())

function onWheelScroll(event: WheelEvent) {
	// Prevent scrolling while panning the canvas
	if (pointer.down && !canvas.select)
		return

	const isMouseWheel = !isTrackpad(event)
	let deltaX = event.deltaX
	let deltaY = event.deltaY

	// Swap axes when holding shift
	if (event.shiftKey)
		[deltaX, deltaY] = [deltaY, deltaX]

	if (isMouseWheel)
		(deltaX = Math.sign(deltaX) * 100, deltaY = Math.sign(deltaY) * 100)

	canvas.scroll.x -= deltaX
	canvas.scroll.y -= deltaY

	if (isMouseWheel)
		animateSmoothScroll()
	else {
		canvas.scroll.smoothX = canvas.scroll.x
		canvas.scroll.smoothY = canvas.scroll.y
	}
}

function onWheelZoom(event: WheelEvent) {
	// Prevent zooming while panning the canvas
	if (pointer.down && !canvas.select)
		return

	const isMouseWheel = !isTrackpad(event)
	const delta = isMouseWheel ? Math.sign(event.deltaY) * .2 : event.deltaY / 100

	setCanvasZoom(canvas.zoom * (1 - delta), toPos(event))

	if (isMouseWheel)
		animateSmoothScroll()
	else {
		canvas.scroll.smoothX = canvas.scroll.x
		canvas.scroll.smoothY = canvas.scroll.y
		canvas.smoothZoom = canvas.zoom
	}
}

function onPointerDown(event: PointerEvent) {
	if (pointer.gesture)
		return

	pointer.type = event.pointerType
	pointer.down = true
	pointer.pos = toPos(event)
	pointer.downPos = pointer.pos
	canvas.select = isMacOS ? event.metaKey : event.ctrlKey
	activeElement = document.activeElement

	if (canvas.select)
		selection.clear()
}

function onPointerMove(event: PointerEvent) {
	pointer.pos = toPos(event)

	if (!pointer.down || !(pointer.moved || moveThreshold(pointer.downPos, pointer.pos, isPointerCoarse() ? 10 : 4)))
		return

	pointer.moved = true

	if (canvas.select) {
		updateSelectionRect()

		// Scroll the canvas when selecting cards near the edge
		animateEdgeScroll(pointer.pos)

		return
	}

	// Pan the canvas
	canvas.scroll.x += event.movementX
	canvas.scroll.y += event.movementY
	canvas.scroll.smoothX = canvas.scroll.x
	canvas.scroll.smoothY = canvas.scroll.y
	canvas.scroll.velocity = {
		x: event.movementX,
		y: event.movementY
	}
}

function onPointerUp(event?: PointerEvent) {
	if (event?.type !== 'pointerup')
		resetPointerPos()

	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		// Make scrolling feel like it has inertia on touch devices
		let prevTimestamp = Infinity

		function kineticScrollStep(timestamp: number) {
			const delta = Math.max(timestamp - prevTimestamp, 0) / (1000 / 60)

			canvas.scroll.x += canvas.scroll.velocity.x * delta
			canvas.scroll.y += canvas.scroll.velocity.y * delta
			canvas.scroll.smoothX = canvas.scroll.x
			canvas.scroll.smoothY = canvas.scroll.y
			canvas.scroll.velocity.x *= 0.95 ** delta
			canvas.scroll.velocity.y *= 0.95 ** delta

			if ((Math.abs(canvas.scroll.velocity.x) > .25 || Math.abs(canvas.scroll.velocity.y) > .25) && !(pointer.down || pointer.gesture))
				requestAnimationFrame(kineticScrollStep)

			prevTimestamp = timestamp
		}

		if (pointer.type === 'touch' && moveThreshold(canvas.scroll.velocity, { x: 0, y: 0 }, 4))
			requestAnimationFrame(kineticScrollStep)
	}

	pointer.down = false
	pointer.moved = false
	canvas.select = false
	selection.visible = false

	stopEdgeScroll()
}

// Start a pinch-to-zoom gesture
function onTouchStart(event: TouchEvent) {
	if (event.touches.length !== 2)
		return

	pointer.gesture = true

	if (pointer.down)
		onPointerUp()

	gesture.initialTouches = Array.from(event.touches)
	gesture.initialZoom = canvas.smoothZoom
	gesture.prevTranslation = { x: 0, y: 0 }
}

function onTouchMove(event: TouchEvent) {
	// Filter out all touchpoints not involved in the gesture
	const touches = Array.from(event.touches).filter(t => gesture.initialTouches.some(i => i.identifier === t.identifier))

	if (!pointer.gesture || touches.length === 0)
		return

	const initialTouchPoints = toPosArray(gesture.initialTouches)
	const touchPoints = toPosArray(touches)
	const origin = midpoint(initialTouchPoints)
	const currentMidpoint = midpoint(touchPoints)
	const transform = {
		scale: distance(touchPoints) / distance(initialTouchPoints),
		translation: {
			x: currentMidpoint.x - origin.x,
			y: currentMidpoint.y - origin.y
		}
	}
	const translationDelta = {
		x: transform.translation.x - gesture.prevTranslation.x,
		y: transform.translation.y - gesture.prevTranslation.y
	}

	// Elastic zoom
	setCanvasZoom(gesture.initialZoom * transform.scale, {
		x: origin.x + transform.translation.x,
		y: origin.y + transform.translation.y
	}, true)

	// Apply transformations to the canvas
	canvas.scroll.x += translationDelta.x
	canvas.scroll.y += translationDelta.y
	canvas.scroll.smoothX = canvas.scroll.x
	canvas.scroll.smoothY = canvas.scroll.y
	canvas.smoothZoom = canvas.zoom
	gesture.prevTranslation = transform.translation
}

function onTouchEnd(event: TouchEvent) {
	// As long as the two initial touches are still down, the gesture isn't completed
	pointer.gesture = gesture.initialTouches.filter(i => Array.from(event.touches).some(t => t.identifier === i.identifier)).length === 2

	// Elastic zoom bounce back
	if (!pointer.gesture && (canvas.zoom > 2 || canvas.zoom < .2)) {
		const canvasRect = canvas.ref.getBoundingClientRect()

		setCanvasZoom(canvas.zoom, {
			x: canvasRect.x + canvasRect.width / 2,
			y: canvasRect.y + canvasRect.height / 2
		})
		animateSmoothScroll(300)
	}
}

function onClick(event: MouseEvent) {
	selection.clear()

	// Require double click to create cards when using a mouse
	if (activeElement !== document.body || (pointer.type === 'mouse' && event.detail < 2))
		return

	createCard({ position: toCanvasPos(canvas, event) })
}

async function onDrop(event: DragEvent) {
	if (event.target === canvas.ref && event.dataTransfer)
		await handleDataTransfer(event.dataTransfer, toCanvasPos(canvas, toPos(event)))
}

// Reset the pointer position to the top left corner of the canvas when the pointer goes out of bounds
// This position is used for the placement of new cards when pasting content
function resetPointerPos() {
	if (!canvas.ref)
		return

	const canvasRect = canvas.ref.getBoundingClientRect()

	pointer.pos = {
		x: canvasRect.x + 20,
		y: canvasRect.y + 20
	}
}

// Zoom and adjust scroll to the pointer position
function setCanvasZoom(zoom: number, adjust: Position, elastic = false) {
	const prevPointerPos = toCanvasPos(canvas, adjust, false)

	if (elastic) {
		if (zoom > 2)
			zoom = 2 + Math.log(zoom - 1)
		if (zoom < .2)
			zoom = (zoom / 0.2) ** Math.E * 0.1 + 0.1
	}
	else
		zoom = Math.max(Math.min(zoom, 2), .2)

	canvas.zoom = zoom

	const pointerPos = toCanvasPos(canvas, adjust, false)
	const dX = (prevPointerPos.x - pointerPos.x) * canvas.zoom
	const dY = (prevPointerPos.y - pointerPos.y) * canvas.zoom

	canvas.scroll.x -= dX
	canvas.scroll.y -= dY
}

function updateSelectionRect() {
	if (!canvas.select || !pointer.moved)
		return

	if (!selection.rect) {
		const downPos = toCanvasPos(canvas, pointer.downPos)

		selection.rect = new DOMRect(downPos.x, downPos.y, 0, 0)
		selection.visible = true
	}

	const mousePos = toCanvasPos(canvas, pointer.pos)

	selection.rect = new DOMRect(
		selection.rect.x,
		selection.rect.y,
		mousePos.x - selection.rect.x,
		mousePos.y - selection.rect.y
	)
}
</script>

<template>
	<div
		ref="canvasRef"
		class="canvas-wrapper"
		:style="{ cursor: pointer.down && pointer.moved && !selection.visible ? 'move' : 'default' }"

		@wheel.exact.prevent="onWheelScroll"
		@wheel.shift.exact.prevent="onWheelScroll"
		@wheel.ctrl.prevent="onWheelZoom"
		@wheel.meta.prevent="onWheelZoom"

		@pointerdown.left.self="onPointerDown"
		@pointerdown.middle.self="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"

		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
		@touchcancel="onTouchEnd"

		@click.left.self="onClick"

		@dragenter.stop.prevent
		@dragover.stop.prevent
		@drop.stop.prevent="onDrop"
	>
		<svg class="canvas-background">
			<pattern
				id="dot-pattern"
				patternUnits="userSpaceOnUse"
				:x="canvas.scroll.smoothX"
				:y="canvas.scroll.smoothY"
				:width="gridSize"
				:height="gridSize"
			>
				<circle cx=".75" cy=".75" r=".75" />
			</pattern>
			<rect x="0" y="0" width="100%" height="100%" fill="url(#dot-pattern)" />
		</svg>
		<div
			class="canvas"
			:class="{ overview: canvas.smoothZoom < 0.5 }"
			:style="{
				translate: `${canvas.scroll.smoothX}px ${canvas.scroll.smoothY}px`,
				scale: canvas.smoothZoom,
				willChange: animating ? 'transform' : 'auto'
			}"
		>
			<div
				class="selection-rect"
				:style="{
					width: `${Math.abs(selection.rect?.width || 0)}px`,
					height: `${Math.abs(selection.rect?.height || 0)}px`,
					translate: `${selection.rect?.left || 0}px ${selection.rect?.top || 0}px`,
					borderWidth: `${1 / canvas.zoom}px`,
					opacity: selection.visible ? 1 : 0,
					transition: `opacity ${selection.visible ? 0 : .2}s`
				}"
			/>
			<Card
				v-for="card in cards"
				:key="card.id"
				:card
				:canvas
				:selection
			/>
		</div>
	</div>
</template>

<style lang="scss">
.canvas-wrapper {
	position: absolute;
	grid-area: main;
	width: 100%;
	height: 100%;
	overflow: clip; // 'hidden' would make the browser scroll when typing in a card that overflows the view
	user-select: none;
	touch-action: none;

	.canvas-background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;

		circle {
			fill: #363636;
		}
	}

	.canvas {
		position: absolute;

		.selection-rect {
			position: absolute;
			background-color: var(--color-accent-25);
			border: 1px solid var(--color-accent);
			pointer-events: none;
		}
	}
}
</style>
