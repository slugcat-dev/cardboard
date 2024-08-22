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
const continuousScroll = {
	lock: false,
	direction: { x: 0, y: 0 },
	speed: 0
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

	function animateContinuousScroll(direction: Position, speed: number) {
		continuousScroll.direction = direction
		continuousScroll.speed = speed

		if (continuousScroll.lock)
			return

		continuousScroll.lock = true

		let prevTimestamp = Infinity

		function continuousScrollStep(timestamp: number) {
			const delta = Math.max(timestamp - prevTimestamp, 0) / 1000
			const scrollX = continuousScroll.direction.x * continuousScroll.speed * delta
			const scrollY = continuousScroll.direction.y * continuousScroll.speed * delta

			canvas.scroll.x += scrollX
			canvas.scroll.y += scrollY

			animateSmoothScroll()

			if (continuousScroll.lock)
				requestAnimationFrame(continuousScrollStep)

			prevTimestamp = timestamp
		}

		requestAnimationFrame(continuousScrollStep)
	}

	function stopContinuousScroll() {
		continuousScroll.lock = false
	}

	function animateEdgeScroll(position: Position) {
		// Check if the pointer is near an edge
		const canvasRect = canvas.ref.getBoundingClientRect()
		const threshold = 100
		const distances = {
			top: position.y - canvasRect.top,
			bottom: canvasRect.bottom - position.y,
			left: position.x - canvasRect.left,
			right: canvasRect.right - position.x
		}
		const direction = { x: 0, y: 0 }

		if (distances.top < threshold)
			direction.y = threshold - distances.top
		else if (distances.bottom < threshold)
			direction.y = -(threshold - distances.bottom)

		if (distances.left < threshold)
			direction.x = threshold - distances.left
		else if (distances.right < threshold)
			direction.x = -(threshold - distances.right)

		// Scroll the canvas depending on how close to the edge the pointer is
		animateContinuousScroll(direction, 10)
	}

	function stopEdgeScroll() {
		stopContinuousScroll()
	}

	return {
		animateSmoothScroll,
		animateContinuousScroll,
		stopContinuousScroll,
		animateEdgeScroll,
		stopEdgeScroll
	}
}
