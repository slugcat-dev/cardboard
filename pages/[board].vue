<script setup lang="ts">
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
	initialTouches: [] as Position[],
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
	waiting: false,
	cardDragAllowed: computed(() => !pointer.down && !pointer.gesture)
})
const selection = reactive({
	rect: process.client ? new DOMRect() : undefined,
	cards: [] as Card[],
	visible: false,
	cleared: 0,
	clear() {
		selection.rect = undefined
		selection.cards = []
		selection.cleared++
	}
})
const gridSize = computed(() => {
	let value = 20 * canvas.smoothZoom

	// Adjust the grid density to the zoom level
	while (value <= 10) value *= 2
	while (value >= 30) value /= 2

	return value
})
const {
	animateSmoothScroll,
	animateEdgeScroll,
	stopEdgeScroll
} = useSmoothScroll(canvas)
const {	board } = await useBoards()
const cards = ref(board.value.cards)
let activeElement: Element | null

definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
onMounted(resetPointerPos)

// Listen for paste events on the entire document
useEventListener('paste', async (event: ClipboardEvent) => {
	canvas.waiting = true

	if (event.target === document.body && event.clipboardData)
		await handleDataTransfer(event.clipboardData, toCanvasPos(canvas, pointer.pos))

	canvas.waiting = false
})

// Update the selection rect on scroll
watch(canvas, () => updateSelectionRect())
watch(pointer, () => {
	// Prevent panning while a gesture is performed
	if (pointer.gesture)
		return onPointerUp()

	// Scroll the canvas when selecting cards near the edge
	if (canvas.select && pointer.moved)
		animateEdgeScroll(pointer.pos)
})

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
	pointer.downPos = toPos(event)
	canvas.select = isMacOS ? event.metaKey : event.ctrlKey
	activeElement = document.activeElement

	if (canvas.select)
		selection.clear()
}

function onPointerMove(event: PointerEvent) {
	pointer.pos = toPos(event)

	if (!pointer.down || pointer.gesture || (!pointer.moved && moveThreshold(pointer.downPos, pointer.pos, isPointerCoarse() ? 10 : 4)))
		return

	pointer.moved = true

	if (canvas.select)
		return updateSelectionRect()

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
		function kineticScrollStep() {
			canvas.scroll.x += canvas.scroll.velocity.x
			canvas.scroll.y += canvas.scroll.velocity.y
			canvas.scroll.smoothX = canvas.scroll.x
			canvas.scroll.smoothY = canvas.scroll.y
			canvas.scroll.velocity.x *= .95
			canvas.scroll.velocity.y *= .95

			if ((Math.abs(canvas.scroll.velocity.x) > .25 || Math.abs(canvas.scroll.velocity.y) > .25) && !pointer.down)
				requestAnimationFrame(kineticScrollStep)
		}

		if (pointer.type === 'touch' && moveThreshold(canvas.scroll.velocity, { x: 0, y: 0 }, 4) && !pointer.gesture)
			requestAnimationFrame(kineticScrollStep)
	}

	pointer.down = false
	pointer.moved = false
	canvas.select = false
	selection.visible = false

	stopEdgeScroll()
}

function onTouchStart(event: TouchEvent) {
	const touches = toPosArray(event.touches)

	pointer.gesture = touches.length >= 2

	if (!pointer.gesture)
		return

	gesture.initialTouches = touches
	gesture.initialZoom = canvas.smoothZoom
	gesture.prevTranslation = { x: 0, y: 0 }
}

function onTouchMove(event: TouchEvent) {
	if (!pointer.gesture)
		return

	const touches = toPosArray(event.touches)
	const origin = midpoint(gesture.initialTouches)
	const currentMidpoint = midpoint(touches)
	const transform = {
		scale: distance(touches) / distance(gesture.initialTouches),
		translation: {
			x: currentMidpoint.x - origin.x,
			y: currentMidpoint.y - origin.y
		}
	}
	const translationDelta = {
		x: transform.translation.x - gesture.prevTranslation.x,
		y: transform.translation.y - gesture.prevTranslation.y
	}

	setCanvasZoom(gesture.initialZoom * transform.scale, {
		x: origin.x + transform.translation.x,
		y: origin.y + transform.translation.y
	}, true)

	canvas.scroll.x += translationDelta.x
	canvas.scroll.y += translationDelta.y
	canvas.scroll.smoothX = canvas.scroll.x
	canvas.scroll.smoothY = canvas.scroll.y
	canvas.smoothZoom = canvas.zoom
	gesture.prevTranslation = transform.translation
}

function onTouchEnd(event: TouchEvent) {
	// As long as there are still more than two touch points, the gesture isn't done
	onTouchStart(event)

	// Elastic zoom
	if (!pointer.gesture && (canvas.zoom > 2 || canvas.zoom < .2)) {
		const rect = canvas.ref.getBoundingClientRect()

		setCanvasZoom(canvas.zoom, {
			x: rect.width / 2,
			y: rect.height / 2
		})
		animateSmoothScroll(300)
	}
}

function onClick(event: MouseEvent) {
	selection.clear()

	// Require double click to create cards when using a mouse
	if (activeElement !== document.body || (pointer.type === 'mouse' && event.detail < 2))
		return

	cards.value.push({
		id: 'create',
		type: 'text',
		position: toCanvasPos(canvas, event),
		content: ''
	})
}

async function onDrop(event: DragEvent) {
	canvas.waiting = true

	if (event.dataTransfer)
		await handleDataTransfer(event.dataTransfer, toCanvasPos(canvas, toPos(event)))

	canvas.waiting = false
}

// Reset the pointer position to the top left corner of the canvas when the pointer goes out of bounds
// This position is used for the placement of new cards when pasting content
function resetPointerPos() {
	const canvasRect = canvasRef.value.getBoundingClientRect()

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
		:style="{ cursor: canvas.waiting ? 'progress' : pointer.down && pointer.moved && !selection.visible ? 'move' : 'default' }"

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
				scale: canvas.smoothZoom
			}"
		>
			<div
				class="selection-rect"
				:style="{
					width: `${Math.abs(selection.rect?.width || 0)}px`,
					height: `${Math.abs(selection.rect?.height || 0)}px`,
					translate: `${selection.rect?.left || 0}px ${selection.rect?.top || 0}px`,
					borderWidth: `${1 / canvas.zoom}px`,
					opacity: selection.visible ? 1 : 0
				}"
			/>
			<NewCard
				v-for="card in cards"
				:key="card.id"
				:card="card"
				:canvas="canvas"
				:selection="selection"
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
			transition: opacity .2s;
			pointer-events: none;
		}
	}
}
</style>
