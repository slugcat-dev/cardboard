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
	padding: .5rem .75rem;
	gap: .25rem;
	font-size: .75rem;
	align-items: center;
	background-color: var(--color-card-background);
	border: 1px solid var(--color-card-border);
	border-bottom-width: 2px;
	border-radius: .375rem;
	cursor: pointer;

	&.danger {
		color: black;
		background-color: var(--color-danger);
		border-color: var(--color-danger);
		transition: box-shadow .1s;

		&:hover {
			box-shadow: 0px 0px 0px 2px var(--color-danger-50);
		}
	}
}
</style>
