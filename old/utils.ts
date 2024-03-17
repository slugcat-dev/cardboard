// TODO: THIS FILE IS SO UGLY I HATE IT

import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(html: string) {
	return DOMPurify.sanitize(html)
}

export function getMouseEventCaretRange(event: PointerEvent | MouseEvent) {
	// @ts-expect-error The new fancy Firefox-only way that doesn't even have documentation
	if (event.rangeOffset) {
		const range = document.createRange()

		// @ts-expect-error Mozilla implementing features but not even updating their own docs imagine
		range.setStart(event.rangeParent, event.rangeOffset)
		range.collapse(true)

		return range
	}

	// @ts-expect-error VSC keeps telling me the method doesn't exist
	else if (document.caretPositionFromPoint) {
		// @ts-expect-error The 'official' way (only used by Firefox) that doesn't even position the cursor correctly
		const pos = document.caretPositionFromPoint(event.clientX, event.clientY)
		const range = document.createRange()

		range.setStart(pos.offsetNode, pos.offsetX)
		range.collapse(true)

		return range
	}
	else if (document.caretRangeFromPoint) {
		// The 'deprecated WebKit-proprietary fallback method' (used by every mf browser out there)
		return document.caretRangeFromPoint(event.clientX, event.clientY) as Range
	}
}

export async function isImageAccessible(url: string) {
	// Allow base64 data URLs
	if (isBase64(url))
		return true

	try {
		const res = await fetch(new URL(url).toString())

		return /image\/*/.test(res.headers.get('content-type') || '')
	}
	catch {}

	return false
}

export function isBase64(string: string) {
	// TODO:
	if (/^(?:data:\w+\/[a-zA-Z\+\-\.]+;base64,)(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/gi.test(string))
		return true
}

export async function getLinkPreview(url: string) {
	if (/^(?!.*<br>)https?:\/\/\S+?\.\S+$/gi.test(url)) {
		try {
			return await $fetch('/api/link-preview', { query: { url: new URL(url).toString() } })
		}
		catch {}
	}

	return false
}

export function cancleEvent(event: Event) {
	event.stopImmediatePropagation()
	event.preventDefault()
	event.stopPropagation()
}

export function suppressNextClick() {
	document.addEventListener('click', function suppressEvent(event: MouseEvent) {
		document.removeEventListener('click', suppressEvent, true)
		cancleEvent(event)
	}, true)
}

export async function convert(card: Card) {
	// Convert text cards to image cards or link embeds
	const linkPreview = await getLinkPreview(card.content)

	if (linkPreview) {
		if ('isImage' in linkPreview && linkPreview.isImage)
			card.type = 'image'
		else {
			card.type = 'link'
			card.content = linkPreview
		}
	}

	return card
}
