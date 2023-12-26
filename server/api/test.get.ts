import { getRequestURL } from 'h3'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
	return [
		getRequestProtocol(event, { xForwardedProto: true }),
		getRequestURL(event, { xForwardedProto: true })
	]
})

export function getRequestProtocol(event: H3Event, opts: { xForwardedProto?: boolean } = {}) {
	if (opts.xForwardedProto !== false && event.node.req.headers['x-forwarded-proto'] === 'https')
		return 'https'

	return (event.node.req.connection as any)?.encrypted ? 'https' : 'http'
}
