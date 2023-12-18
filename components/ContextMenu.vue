<style lang="scss">
	.context-menu {
		position: fixed;
		padding: .25rem;
		background-color: var(--color-card-background);
		border: 1px solid var(--color-card-border);
		border-radius: .25rem;
		box-shadow: var(--shadow-card);
		z-index: 10;
	}
</style>

<template>
	<div
		class="context-menu"
		:style="{
			top: `${y}px`,
			left: `${x}px`
		}"
	>
		Hello, world
	</div>
</template>

<script setup lang="ts">
defineProps([
	'x',
	'y'
])
</script>
