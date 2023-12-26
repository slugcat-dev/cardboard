import {
	getRequestProtocol,
	getRequestURL
} from 'h3'

export default defineEventHandler(async (event) => {
	return [
		getRequestProtocol(event),
		getRequestURL(event)
	]
})
