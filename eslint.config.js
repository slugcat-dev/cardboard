// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({ rules: {
	'@stylistic/semi': ['error', 'never'],
	'@stylistic/comma-dangle': ['error', 'never']
} })
