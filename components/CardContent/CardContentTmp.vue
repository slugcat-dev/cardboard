<script setup lang="ts">
defineProps(['card'])
</script>

<template>
	<ul class="card-content card-content-tmp">
		<li v-for="task of card.content.tasks" :key="task">
			{{ task.content }}
		</li>
	</ul>
</template>

<style lang="scss">
.card-content-tmp {
	padding: .375rem;
	padding-left: 1.5rem;
	font-size: .875rem;
	background-color: #432;
	border: 2px solid var(--color-border);
	border-radius: .375rem;
	box-shadow: var(--shadow-card);
}
</style>
