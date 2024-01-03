<script setup lang="ts">
defineProps(['card'])
</script>

<template>
	<NuxtLink :to="card.content">
		{{ card.content }}
	</NuxtLink>
</template>

<style lang="scss">

</style>
