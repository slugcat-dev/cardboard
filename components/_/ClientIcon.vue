<script setup lang="ts">
defineProps(['name', 'size'])
</script>

<template>
	<ClientOnly>
		<IconCSS :size="size" :name="name" />
	</ClientOnly>
</template>
