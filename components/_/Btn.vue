<script setup lang="ts">
defineProps({
	role: { type: String, default: 'default' },
	icon: { type: String, default: null }
})
</script>

<template>
	<button
		class="btn"
		:class="role"
	>
		<Icon
			v-if="icon"
			:name="icon"
		/>
		<slot />
	</button>
</template>

<style lang="scss">
.btn {
	display: inline-flex;
	gap: .25rem;
	align-items: center;
	padding: .5rem .75rem;
	font-size: .75rem;
	background-color: var(--color-background-tertiary);
	border: 1px solid var(--color-border);
	border-bottom-width: 2px;
	border-radius: .375rem;
	cursor: pointer;

	&.danger {
		color: black;
		background-color: var(--color-danger);
		border-color: var(--color-danger);
		transition: box-shadow .1s;

		&:hover {
			box-shadow: 0 0 0 2px var(--color-danger-50);
		}
	}
}
</style>
