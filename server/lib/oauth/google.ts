import type { H3Event } from 'h3'
import {
	createError,
	eventHandler,
	getQuery,
	getRequestURL,
	sendRedirect
} from 'h3'
import { parsePath, withQuery } from 'ufo'
import { ofetch } from 'ofetch'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'
import type { OAuthConfig } from '#auth-utils'

export type OAuthGoogleConfig = {
	/**
	 * Google OAuth Client ID
	 * @default process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
	 */
	clientId?: string

	/**
	 * Google OAuth Client Secret
	 * @default process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
	 */
	clientSecret?: string

	/**
	 * Google OAuth Scope
	 * @default []
	 * @see https://developers.google.com/identity/protocols/oauth2/scopes#google-sign-in
	 * @example ['email', 'openid', 'profile']
	 */
	scope?: string[]

	/**
	 * Google OAuth Authorization URL
	 * @default 'https://accounts.google.com/o/oauth2/v2/auth'
	 */
	authorizationURL?: string

	/**
	 * Google OAuth Token URL
	 * @default 'https://oauth2.googleapis.com/token'
	 */
	tokenURL?: string

	/**
	 * Redirect URL post authenticating via google
	 * @default '/auth/google'
	 */
	redirectUrl: '/auth/google'
}

export function googleEventHandler({
	config,
	onSuccess,
	onError
}: OAuthConfig<OAuthGoogleConfig>) {
	return eventHandler(async (event: H3Event) => {
		config = defu(config, useRuntimeConfig(event).oauth?.google, {
			authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenURL: 'https://oauth2.googleapis.com/token'
		}) as OAuthGoogleConfig
		const { code } = getQuery(event)

		if (!config.clientId) {
			const error = createError({
				statusCode: 500,
				message: 'Missing NUXT_OAUTH_GOOGLE_CLIENT_ID env variables.'
			})
			if (!onError)
				throw error
			return onError(event, error)
		}

		// const redirectUrl = getRequestURL(event).href
		console.log(getRequestURL(event).href)
		const redirectUrl = 'https://pinwall.doublekekse.dev/auth/google'

		if (!code) {
			config.scope = config.scope || ['email', 'profile']
			// Redirect to Google Oauth page
			return sendRedirect(
				event,
				withQuery(config.authorizationURL as string, {
					response_type: 'code',
					client_id: config.clientId,
					redirect_uri: redirectUrl,
					scope: config.scope.join(' ')
				})
			)
		}

		const body: any = {
			grant_type: 'authorization_code',
			redirect_uri: parsePath(redirectUrl).pathname,
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code
		}
		const tokens: any = await ofetch(config.tokenURL as string, {
			method: 'POST',
			body
		}).catch((error) => {
			return { error }
		})
		if (tokens.error) {
			const error = createError({
				statusCode: 401,
				message: `Google login failed: ${
          tokens.error?.data?.error_description || 'Unknown error'
        }`,
				data: tokens
			})
			if (!onError)
				throw error
			return onError(event, error)
		}

		const accessToken = tokens.access_token
		const user: any = await ofetch(
			'https://www.googleapis.com/oauth2/v3/userinfo',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}
		)

		return onSuccess(event, {
			tokens,
			user
		})
	})
}
