import type { Page } from 'puppeteer-core'
import puppeteer from 'puppeteer-core'

const minimalArgs = [
	'--autoplay-policy=user-gesture-required',
	'--disable-background-networking',
	'--disable-background-timer-throttling',
	'--disable-backgrounding-occluded-windows',
	'--disable-crash-reporter',
	'--disable-client-side-phishing-detection',
	'--disable-component-update',
	'--disable-default-apps',
	'--disable-dev-shm-usage',
	'--disable-domain-reliability',
	'--disable-extensions',
	'--disable-features=AudioServiceOutOfProcess',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-notifications',
	'--disable-offer-store-unmasked-wallet-cards',
	'--disable-popup-blocking',
	'--disable-print-preview',
	'--disable-prompt-on-repost',
	'--disable-renderer-backgrounding',
	'--disable-setuid-sandbox',
	'--disable-speech-api',
	'--disable-sync',
	'--hide-scrollbars',
	'--ignore-gpu-blacklist',
	'--metrics-recording-only',
	'--mute-audio',
	'--no-default-browser-check',
	'--no-first-run',
	'--no-pings',
	'--no-sandbox',
	'--no-zygote',
	'--password-store=basic',
	'--use-gl=swiftshader',
	'--use-mock-keychain'
]

function isBase64(string: string) {
	// TODO:
	if (/^(?:data:\w+\/[a-zA-Z+\-.]+;base64,)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gi.test(string))
		return true
}

async function isImageAccessible(url: string) {
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

export default defineEventHandler(async (event) => {
	await requireUserSession(event)

	const query = getQuery(event)
	const url = validateURL(query.url?.toString())

	if (!url) {
		return createError({
			statusCode: 400,
			statusMessage: 'Invalid URL'
		})
	}

	return await getLinkPreviewData(url.toString())
})

function validateURL(url: string | undefined) {
	if (!url)
		return false

	try {
		return new URL(url)
	} catch {
		return false
	}
}

async function getLinkPreviewData(url: string) {
	const browser = await puppeteer.launch({
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
		args: minimalArgs
	})
	const page = await browser.newPage()

	await page.setViewport({ width: 1920, height: 1080 })
	await page.setRequestInterception(true)

	page.on('request', (req) => {
		if (['stylesheet', 'font'].includes(req.resourceType()))
			return req.abort()

		req.continue()
	})

	page.setUserAgent('Mozilla/5.0 (compatible; LinkPreview/1.0)')
	await page.goto(url)
	await page.exposeFunction('isImageAccessible', isImageAccessible)

	const metadata = {
		isImage: await isImageAccessible(url) ? true : undefined,
		siteName: await getSiteName(page),
		title: await getTitle(page),
		description: await getDescription(page),
		favicon: await getFavicon(page),
		image: await getImage(page),
		domain: new URL(url).hostname,
		canonicalLink: await getCanonicalLink(page, url),
		url
	}

	await browser.close()

	return metadata
}

async function getSiteName(page: Page) {
	return await page.evaluate(() => {
		const ogSiteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')

		if (ogSiteName && ogSiteName.content.length > 0)
			return ogSiteName.content
	})
}

async function getTitle(page: Page) {
	return await page.evaluate(() => {
		const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')

		if (ogTitle && ogTitle.content.length > 0)
			return ogTitle.content

		const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')

		if (twitterTitle && twitterTitle.content.length > 0)
			return twitterTitle.content

		const title = document.querySelector<HTMLTitleElement>('title')

		if (title && title.text.length > 0)
			return title.text

		if (document.title.length > 0)
			return document.title

		const h1 = document.querySelector('h1')?.textContent

		if (h1 && h1.length > 0)
			return h1
	})
}

async function getDescription(page: Page) {
	return await page.evaluate(() => {
		const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')

		if (ogDescription && ogDescription.content.length > 0)
			return ogDescription.content

		const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')

		if (twitterDescription && twitterDescription.content.length > 0)
			return twitterDescription.content

		const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')

		if (metaDescription && metaDescription.content.length > 0)
			return metaDescription.content
	})
}

async function getFavicon(page: Page) {
	return await page.evaluate(async () => {
		const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

		if (icon && icon.href.length > 0 && await isImageAccessible(icon.href))
			return icon.href

		const shortcutIcon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')

		if (shortcutIcon && shortcutIcon.href.length > 0 && await isImageAccessible(shortcutIcon.href))
			return shortcutIcon.href

		const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')

		if (appleTouchIcon && appleTouchIcon.href.length > 0 && await isImageAccessible(appleTouchIcon.href))
			return appleTouchIcon.href

		const favicon = `${window.origin}/favicon.ico`

		if (await isImageAccessible(favicon))
			return favicon
	})
}

async function getImage(page: Page) {
	return page.evaluate(async () => {
		const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')

		if (ogImage && ogImage.content.length > 0 && await isImageAccessible(ogImage.content))
			return ogImage.content

		const imageSrc = document.querySelector<HTMLLinkElement>('link[rel="image_src"]')

		if (imageSrc && imageSrc.href.length > 0 && await isImageAccessible(imageSrc.href))
			return imageSrc.href

		const twitterImage = document.querySelector<HTMLMetaElement>('meta[property="twitter:image"]')

		if (twitterImage && twitterImage.content.length > 0 && await isImageAccessible(twitterImage.content))
			return twitterImage.content
	})
}

async function getCanonicalLink(page: Page, originalUrl: string) {
	const canonicalLink = await page.evaluate(() => {
		const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

		if (canonical && canonical.href.length > 0)
			return canonical.href

		const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')

		if (ogUrl && ogUrl.content.length > 0)
			return ogUrl.content

		return window.location.href
	})

	if (canonicalLink === originalUrl)
		return

	return canonicalLink
}
