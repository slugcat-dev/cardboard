<!-- eslint-disable vue/no-mutating-props -->

<script setup lang="ts">
import { CardContentImage, CardContentLink, CardContentText, CardContentTmp } from '#components'

const { card, canvas, selection } = defineProps<{
	card: Card
	canvas: any
	selection: any
}>()
const { animateEdgeScroll, stopEdgeScroll } = useSmoothScroll(canvas)
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
watch(canvas, () => {
	if (!pointer.down)
		return

	if (!cardInteractionAllowed())
		return onPointerUp()

	if (!pointer.moved)
		pointer.moved = true

	updateCardPos()
})

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

function onPointerDown(event: PointerEvent) {
	if (!cardInteractionAllowed(event))
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
	pointer.pos = toPos(event)

	if (!pointer.down || !(pointer.moved || moveThreshold(pointer.downPos, pointer.pos, isPointerCoarse() ? 10 : 4)))
		return

	pointer.moved = true

	clearTimeout(longPressTimeout)
	updateCardPos()
	animateEdgeScroll(pointer.pos)
}

function onPointerUp() {
	if (pointer.moved) {
		if (pointer.type === 'mouse')
			suppressClick()

		if (selection.cards.length > 1)
			fetchUpdateMany(selection.cards)
		else
			fetchUpdateCard({ id: card.id, position: card.position })
	}

	pointer.down = false
	pointer.moved = false

	clearTimeout(longPressTimeout)
	stopEdgeScroll()
}

function onContextMenu(event: MouseEvent) {
	if (!cardInteractionAllowed(event))
		return

	event.preventDefault()
	deleteCard()
}

function getContentComponent() {
	switch (card.type) {
		case 'text': return CardContentText
		case 'image': return CardContentImage
		case 'link': return CardContentLink
		case 'tasklist': return CardContentTmp
		default: return CardContentText
	}
}

function updateCardPos() {
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

function cardInteractionAllowed(event?: Event) {
	return (
		cardTargetAllowed(['A', 'INPUT'], event)
		&& canvas.cardDragAllowed
		&& !contentRef.value.active
		&& card.id
	)
}

function deleteCard() {
	if (selected.value) {
		if (selection.cards.length > 1) {
			fetchDeleteMany(selection.cards)
			selection.clear()

			return
		}
	} else
		selection.clear()

	cardRef.value.classList.add('deleted')
	setTimeout(() => fetchDeleteCard(card), 200)
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
			cursor: !card.id ? 'wait' : contentRef?.active ? 'auto' : canvas.select ? 'default' : pointer.down ? 'grabbing' : 'grab'
		}"

		@pointerdown.left.exact="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointerleave="onPointerUp"
		@pointercancel="onPointerUp"

		@click.left.ctrl.exact="selected = !selected"
		@click.left.meta.exact="selected = !selected"
		@contextmenu="onContextMenu"
	>
		<component
			:is="getContentComponent()"
			ref="contentRef"
			:card
			@activate="selection.clear"
		/>
	</div>
</template>

<style>
.card {
	position: absolute;
	transition: scale .1s, opacity .1s;

	&.content-active,
	&.pointer-down,
	&.selected {
		z-index: 1;
	}

	/* Prevent the pointer from leaving the hitbox while dragging the card */
	&.pointer-down::before {
		content: '';
		position: fixed;
		width: 1000vw;
		height: 1000vh;
		translate: -50% -50%;
		z-index: -1;
	}

	&.content-active .card-content-text {
		border-color: var(--color-accent);
	}

	&.selected .card-content {
		border-color: var(--color-accent-50);
	}

	&.deleted {
		scale: .75;
		opacity: 0;
		pointer-events: none;
	}
}

.canvas:has(.card.pointer-down) .card:not(.pointer-down) {
	pointer-events: none;
}
</style>
