<script setup lang="ts">
defineProps<{
	icon?: string
}>()
</script>

<template>
	<button class="icon-button">
		<Icon
			v-if="icon"
			:name="icon"
		/>
		<slot />
	</button>
</template>

<style>
.icon-button {
	display: inline-flex;
	padding: .25rem .5rem;
	gap: .5rem;
	align-items: center;
	justify-content: center;
	line-height: .75rem;
	font-size: .875rem;
	font-family: inherit;
	color: inherit;
	background-color: #8882;
  border: 1px solid #8882;
	border-radius: .375rem;
	cursor: pointer;

	&.large {
		padding: .5rem;
		line-height: 1.125rem;
		font-size: 1rem;
		font-weight: bold;
		border-width: 2px;
	}

	&:disabled {
		opacity: .75;
		cursor: not-allowed;
	}
}
</style>
