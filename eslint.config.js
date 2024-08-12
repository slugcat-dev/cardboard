// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({ rules: {
	'@stylistic/semi': ['error', 'never'],
	'@stylistic/comma-dangle': ['error', 'never'],
	'@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
	'@stylistic/no-floating-decimal': 'off',
	'no-empty': ['error', { allowEmptyCatch: true }],
	'vue/comma-dangle': ['error', 'never']
} })
