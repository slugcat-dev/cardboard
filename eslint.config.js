import antfu from '@antfu/eslint-config'

export default antfu(
	{
		stylistic: {
			indent: 'tab',
			quotes: 'single'
		},
		typescript: true,
		vue: true,
		overrides: { vue: { 'vue/comma-dangle': ['error', 'never'] } }
	},
	{
		rules: {
			'curly': ['error', 'multi-or-nest'],
			'no-console': 'warn',
			'node/prefer-global/process': ['error', 'always'],
			'style/comma-dangle': ['error', 'never'],
			'ts/consistent-type-definitions': ['error', 'type'],
			'style/no-floating-decimal': 'off'
		}
	}
)
