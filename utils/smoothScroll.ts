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

export function animateSmoothScroll(canvas: any, duration = 200) {
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
