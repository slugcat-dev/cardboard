<style>
body {
	overflow: hidden;
}
</style>

<template>
	<div>
		<!-- TODO -->
		<Canvas />
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: 'auth'
})

useSeoMeta({
	title: useRoute().params.board.toString()
})
</script>
