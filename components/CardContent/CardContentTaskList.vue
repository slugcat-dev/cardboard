<template>
	<h2>Tasklist</h2>
	<ul>
		<li
			v-for="task in card.content"
			:key="task"
			:style="{
				textDecoration: task.done ? 'line-through' : 'none',
				opacity: task.done ? .5 : 1
			}"
		>
			{{ task.content }}
		</li>
	</ul>
</template>

<script setup lang="ts">
defineProps(['card'])
</script>
