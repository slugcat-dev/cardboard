import antfu from '@antfu/eslint-config'

export default antfu(
	{
		stylistic: {
			indent: 'tab',
			quotes: 'single'
		},
		overrides: { vue: { 'vue/comma-dangle': ['error', 'never'] } }
	},
	{
		rules: {
			'curly': ['error', 'multi-or-nest'],
			'no-console': 'warn',
			'node/prefer-global/process': ['error', 'always'],
			'style/comma-dangle': ['error', 'never'],
			'ts/consistent-type-definitions': ['error', 'interface'],
			'style/no-floating-decimal': 'off',
			'unicorn/prefer-number-properties': ['error', { checkInfinity: false }],
			'no-unused-expressions': 'off',
			'antfu/curly': 'off',
			'style/brace-style': 'off'
		}
	}
)
