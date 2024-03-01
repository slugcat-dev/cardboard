const smoothScroll = {
	lock: false,
	start: {
		time: 0,
		scroll: { x: 0, y: 0 },
		zoom: 1
	},
	delta: {
		scroll: { x: 0, y: 0 },
		zoom: 0
	}
}
const edgeScroll = {
	lock: false,
	active: false,
	distances: {
		top: Infinity,
		bottom: Infinity,
		left: Infinity,
		right: Infinity
	}
}

export function useSmoothScroll(canvas: any) {
	function animateSmoothScroll(duration = 200) {
		smoothScroll.start.time = performance.now()
		smoothScroll.start.scroll.x = canvas.scroll.smoothX
		smoothScroll.start.scroll.y = canvas.scroll.smoothY
		smoothScroll.start.zoom = canvas.smoothZoom
		smoothScroll.delta.scroll.x = canvas.scroll.x - canvas.scroll.smoothX
		smoothScroll.delta.scroll.y = canvas.scroll.y - canvas.scroll.smoothY
		smoothScroll.delta.zoom = canvas.zoom - canvas.smoothZoom

		if (smoothScroll.lock)
			return

		smoothScroll.lock = true

		function scrollStep(timestamp: number) {
			const elapsedTime = timestamp - smoothScroll.start.time
			const progress = Math.max(Math.min(elapsedTime / duration, 1), 0)
			const ease = (t: number) => (--t) * t * t + 1

			canvas.scroll.smoothX = smoothScroll.start.scroll.x + smoothScroll.delta.scroll.x * ease(progress)
			canvas.scroll.smoothY = smoothScroll.start.scroll.y + smoothScroll.delta.scroll.y * ease(progress)
			canvas.smoothZoom = smoothScroll.start.zoom + smoothScroll.delta.zoom * ease(progress)

			if (elapsedTime < duration)
				requestAnimationFrame(scrollStep)
			else
				smoothScroll.lock = false
		}

		requestAnimationFrame(scrollStep)
	}

	function animateEdgeScroll(position: Position) {
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

			animateSmoothScroll()

			if (edgeScroll.active)
				requestAnimationFrame(edgeScrollStep)
			else
				edgeScroll.lock = false
		}

		requestAnimationFrame(edgeScrollStep)
	}

	function stopEdgeScroll() {
		edgeScroll.active = false
	}

	return {
		animateSmoothScroll,
		animateEdgeScroll,
		stopEdgeScroll
	}
}
