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
		<ClientIcon
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

	&.slim {
		padding: .25rem .5rem;
	}

	&.danger {
		color: black;
		background-color: var(--color-danger);
		border-color: var(--color-danger);
		transition: box-shadow .1s;
	}
}
</style>
