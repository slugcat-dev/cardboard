<style lang="scss">

</style>

<template>
	<NuxtLink :to="card.content">
		{{ card.content }}
	</NuxtLink>
</template>

<script setup lang="ts">
defineProps(['card'])
</script>
