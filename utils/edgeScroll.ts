const edgeScroll = {
	active: false,
	lock: false,
	distances: {
		top: Infinity,
		bottom: Infinity,
		left: Infinity,
		right: Infinity
	}
}

export function animateEdgeScroll(canvas: any, position: Position, condition: boolean) {
	if (!condition)
		return edgeScroll.active = false

	// Check if the pointer is near an edge
	const canvasRect = canvas.ref.getBoundingClientRect()
	const threshold = 100

	edgeScroll.distances = {
		top: position.y - canvasRect.top,
		bottom: canvasRect.bottom - position.y,
		left: position.x - canvasRect.left,
		right: canvasRect.right - position.x
	}
	edgeScroll.active = (
		edgeScroll.distances.top < threshold
		|| edgeScroll.distances.bottom < threshold
		|| edgeScroll.distances.left < threshold
		|| edgeScroll.distances.right < threshold
	)

	if (!edgeScroll.active || edgeScroll.lock)
		return

	edgeScroll.lock = true

	// Scroll the canvas depending on how close to the edge the pointer is
	function edgeScrollStep() {
		const scrollSpeed = .25

		if (edgeScroll.distances.top < threshold)
			canvas.scroll.y += (threshold - edgeScroll.distances.top) * scrollSpeed
		else if (edgeScroll.distances.bottom < threshold)
			canvas.scroll.y -= (threshold - edgeScroll.distances.bottom) * scrollSpeed

		if (edgeScroll.distances.left < threshold)
			canvas.scroll.x += (threshold - edgeScroll.distances.left) * scrollSpeed
		else if (edgeScroll.distances.right < threshold)
			canvas.scroll.x -= (threshold - edgeScroll.distances.right) * scrollSpeed

		// This probably is technically wrong and very costly, but it feels smoother
		animateSmoothScroll(canvas)

		if (edgeScroll.active)
			requestAnimationFrame(edgeScrollStep)
		else
			edgeScroll.lock = false
	}

	requestAnimationFrame(edgeScrollStep)
}
