<script setup lang="ts">
definePageMeta({
	middleware: ['auth', 'breadcrumbs'],
	pageTransition: { name: 'slide' },
	layout: 'board'
})
</script>

<template>
	<BoardCanvas />
</template>

<style lang="scss">
.loading {
	gap: .5rem;
	font-weight: bold;
}
</style>
