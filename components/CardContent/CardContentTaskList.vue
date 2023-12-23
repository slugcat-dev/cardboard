<style lang="scss">
.tasklist {
	padding: .5rem;

	h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		margin: .5rem 0;
		padding: 0;
		gap: .25rem;
		list-style: none;

		li {
			padding: .125rem .25rem;
			background-color: #fff1;
			border-radius: .25rem;
		}
	}

	input {
		margin-right: .25rem;
	}
}
</style>

<template>
	<div class="tasklist">
		<h2>Tasklist</h2>
		<div class="text-secondary">
			Task list cards are in development
		</div>
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
		<input placeholder="Add task" disabled>
		<button disabled>
			+
		</button>
	</div>
</template>

<script setup lang="ts">
defineProps(['card'])
</script>
