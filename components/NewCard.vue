<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
import { CardContentImage, CardContentText } from '#components'

const { card, canvas, selection } = defineProps(['card', 'canvas', 'selection'])
const cardRef = ref()
const contentRef = ref()
const pointer = reactive({
	type: 'unknown',
	down: false,
	downPos: { x: 0, y: 0 },
	pos: { x: 0, y: 0 },
	offset: {
		x: 0,
		y: 0,
		zoom: 1
	},
	moved: false
})
const selected = ref(false)
let longPressTimeout: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => clearTimeout(longPressTimeout))

// Update card position on scroll while dragging
watch(canvas, () => updateCardPos())

// Card selection
watch(selection, () => {
	const cardRect = toCanvasRect(canvas, cardRef.value.getBoundingClientRect())

	// Check if the selection rect intersects with the card rect
	selected.value = selection.rect && !(
		selection.rect.right < cardRect.left
		|| selection.rect.left > cardRect.right
		|| selection.rect.bottom < cardRect.top
		|| selection.rect.top > cardRect.bottom
	)
}, { deep: false })
watch(selected, () => {
	if (selected.value)
		selection.cards.push(card)
	else
		selection.cards.splice(selection.cards.indexOf(card), 1)
})

// Scroll the canvas when dragging a card near the edge
watch(pointer, () => animateEdgeScroll(canvas, pointer.pos, pointer.moved))

function onPointerDown(event: PointerEvent) {
	if (!canvas.cardDragAllowed || contentRef.value.active)
		return

	const cardRect = cardRef.value.getBoundingClientRect()

	pointer.type = event.pointerType
	pointer.down = true
	pointer.downPos = toPos(event)
	pointer.offset = {
		x: event.clientX - cardRect.left,
		y: event.clientY - cardRect.top,
		zoom: canvas.smoothZoom - 1
	}

	if (!selected.value)
		selection.clear()

	// Workaround for the contextmenu event which is not implemented in iOS Safari
	if (navigator.vendor.includes('Apple') && 'ontouchstart' in window) {
		clearTimeout(longPressTimeout)

		longPressTimeout = setTimeout(() => {
			suppressClick()

			onContextMenu(event)
		}, 500)
	}
}

function onPointerMove(event: PointerEvent) {
	if (!pointer.down || !canvas.cardDragAllowed)
		return

	pointer.pos = toPos(event)

	if (!(pointer.moved || moveThreshold(pointer.downPos, pointer.pos, isPointerCoarse() ? 10 : 4)))
		return

	pointer.moved = true

	clearTimeout(longPressTimeout)
	updateCardPos()
}

function onPointerUp() {
	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		if (selection.cards.length > 1)
			updateMany(selection.cards)
		else
			updateCard({ id: card.id, position: card.position })
	}

	pointer.down = false
	pointer.moved = false

	clearTimeout(longPressTimeout)
}

// TODO: Display custom ContextMenu
function onContextMenu(event: MouseEvent) {
	if (contentRef.value.active)
		return

	event.preventDefault()
	delCard()
}

function getContentComponent() {
	switch (card.type) {
		case 'text': return CardContentText
		case 'image': return CardContentImage
		default: return CardContentText
	}
}

function updateCardPos() {
	// Calling onPointerUp here once when a gesture is performed on the canvas to prevent the crad from glitching around
	if (!canvas.cardDragAllowed)
		return onPointerUp()

	if (!pointer.down)
		return

	const prevPosition = card.position

	card.position = toCanvasPos(canvas, {
		x: pointer.pos.x - pointer.offset.x * (canvas.smoothZoom - pointer.offset.zoom),
		y: pointer.pos.y - pointer.offset.y * (canvas.smoothZoom - pointer.offset.zoom)
	})

	if (selection.cards.length > 1) {
		selection.cards.filter((selected: Card) => selected !== card).forEach((c: Card) => {
			c.position = {
				x: c.position.x + card.position.x - prevPosition.x,
				y: c.position.y + card.position.y - prevPosition.y
			}
		})
	}
}

// TODO: rename
function delCard() {
	if (selection.cards.length > 1) {
		deleteMany(selection.cards)
		selection.clear()

		return
	}

	cardRef.value.classList.add('deleted')
	setTimeout(() => deleteCard(card), 200)
}
</script>

<template>
	<div
		ref="cardRef"
		class="card"
		:class="{
			'content-active': contentRef?.active,
			'pointer-down': pointer.down,
			selected
		}"
		:style="{
			translate: `${card.position.x}px ${card.position.y}px`,
			cursor: contentRef?.active ? 'auto' : canvas.select ? 'default' : pointer.down ? 'grabbing' : 'grab'
		}"

		@pointerdown.left.exact="onPointerDown"
		@pointerdown.left.ctrl.exact="selected = !selected"
		@pointerdown.left.meta.exact="selected = !selected"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"

		@contextmenu="onContextMenu"
	>
		<component
			:is="getContentComponent()"
			ref="contentRef"
			:card="card"
			@activate="selection.clear"
		/>
	</div>
</template>

<style lang="scss">
.card {
	position: absolute;
	width: max-content;

	&.content-active,
	&.pointer-down,
	&.selected {
		z-index: 1;
	}

	// Prevent the cursor from leaving the hitbox when moving really fast
	&.pointer-down::before {
		position: fixed;
		z-index: -1;
		content: '';
		inset: -100vh -100vw;
	}

	&.deleted {
		opacity: 0;
		transition: opacity .1s, scale .1s;
		scale: .75;
	}
}
</style>
