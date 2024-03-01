export const isMacOS = process.client && navigator.userAgent.includes('Macintosh')
export const usingInput = ref(false)

watchEffect(() => {
	const activeElement = useActiveElement()
	const tagName = activeElement.value?.tagName.toLowerCase()
	const contentEditable = activeElement.value?.contentEditable.toLowerCase()

	usingInput.value = (
		tagName === 'input'
		|| tagName === 'textarea'
		|| contentEditable === 'true'
		|| contentEditable === 'plaintext-only'
	)
})

export function isPointerCoarse() {
	return window.matchMedia('(pointer: coarse)').matches
}

// Detect if a trackpad is used
// See https://stackoverflow.com/q/10744645/13505160
export function isTrackpad(event: WheelEvent & { wheelDeltaY?: number, wheelDeltaX?: number }) {
	if (event.deltaMode !== event.DOM_DELTA_PIXEL)
		return false

	if ((event.wheelDeltaX && event.wheelDeltaX !== 0 && Math.abs(event.wheelDeltaX) !== 120)
		|| (event.wheelDeltaY && event.wheelDeltaY !== 0 && Math.abs(event.wheelDeltaY) !== 120)
		|| (event.wheelDeltaX && event.wheelDeltaY && event.wheelDeltaX === -3 * event.deltaX && event.wheelDeltaY === -3 * event.deltaY))
		return true

	return false
}

// Check if a pointer was moved at least by a specified amount of pixels
export function moveThreshold(start: Position, current: Position, threshold: number) {
	const dX = Math.abs(start.x - current.x)
	const dY = Math.abs(start.y - current.y)

	return dX >= threshold || dY >= threshold
}

export function cancleEvent(event: Event) {
	event.stopImmediatePropagation()
	event.preventDefault()
	event.stopPropagation()
}

// Suppress the next click event
export function suppressClick() {
	document.addEventListener('click', function suppressEvent(event: MouseEvent) {
		document.removeEventListener('click', suppressEvent, true)
		cancleEvent(event)
	}, true)
}

// Convert screen coordinates to canvas coordinates
export function toCanvasPos(canvas: any, position: Position, smooth = true) {
	const scroll = smooth ? { x: canvas.scroll.smoothX, y: canvas.scroll.smoothY } : canvas.scroll
	const zoom = smooth ? canvas.smoothZoom : canvas.zoom
	const canvasRect = canvas.ref.getBoundingClientRect()

	return {
		x: (position.x - scroll.x - canvasRect.left) / zoom,
		y: (position.y - scroll.y - canvasRect.top) / zoom
	}
}

export function toCanvasRect(canvas: any, rect: DOMRect) {
	const topLeft = toCanvasPos(canvas, rect)
	const bottomRight = toCanvasPos(canvas, { x: rect.x + rect.width, y: rect.y + rect.height })

	return new DOMRect(
		topLeft.x,
		topLeft.y,
		bottomRight.x - topLeft.x,
		bottomRight.y - topLeft.y
	)
}

export function toPos(event: { clientX: number, clientY: number }) {
	return { x: event.clientX, y: event.clientY }
}

export function toPosArray(touches: TouchList) {
	return Array.from(touches).map(point => toPos(point))
}

export function midpoint(positions: Position[]) {
	const sum = positions.reduce((acc, pos) => ({
		x: acc.x + pos.x,
		y: acc.y + pos.y
	}))

	return {
		x: sum.x / positions.length,
		y: sum.y / positions.length
	}
}

export function distance(positions: Position[]) {
	const centroid = midpoint(positions)
	const sum = positions.reduce((_, pos) => Math.hypot(
		pos.x - centroid.x,
		pos.y - centroid.y
	), 0)

	return sum / positions.length
}

export function selectRange(range: Range) {
	const selection = window.getSelection()

	selection?.removeAllRanges()
	selection?.addRange(range)
}
