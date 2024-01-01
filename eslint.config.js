import antfu from '@antfu/eslint-config'

export default antfu(
	{
		stylistic: {
			indent: 'tab',
			quotes: 'single'
		},
		typescript: true,
		vue: true,
		overrides: {
			vue: {
				'vue/comma-dangle': ['error', 'never'],
				'vue/component-tags-order': ['error', {
					order: ['style', 'template', 'script']
				}],
				'vue/block-order': ['error', {
					order: ['style', 'template', 'script']
				}]
			}
		}
	},
	{
		rules: {
			'curly': ['error', 'multi-or-nest'],
			'no-console': 'warn',
			'node/prefer-global/process': ['error', 'always'],
			'style/comma-dangle': ['error', 'never'],
			'ts/consistent-type-definitions': ['error', 'type'],
			'eslintstyle/no-floating-decimal': 'error'
		}
	}
)
