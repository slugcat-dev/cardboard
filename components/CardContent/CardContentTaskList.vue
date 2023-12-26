<style lang="scss">
.tasklist {
	padding: .5rem;

	.name {
		margin: 0;
		font-size: 1.125rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		max-width: 258px;
		margin: .5rem 0;
		padding: 0;
		gap: .25rem;
		list-style: none;

		li {
			display: flex;
			align-items: flex-start;
			padding: .125rem .25rem;
			gap: .5rem;
			font-size: .875rem;
			background-color: #fff1;
			border-radius: .25rem;
			word-break: break-word;

			&.done {
				order: 1;
			}

			& input {
				appearance: none;
				min-width: .875rem;
				width: .875rem;
				height: .875rem;
				margin: 0;
				margin-top: .125rem;
				border: 1px solid gray;
				border-radius: 100%;
				cursor: pointer;

				&:checked {
					background-color: var(--color-accent);

					&::after {
						color: black;
						font-size: .875em;
						margin-left: .125rem;
						content: '✓';
					}
				}
			}

		}
	}

	input {
		width: 100%;
		margin-right: .25rem;
	}
}
</style>

<template>
	<div class="tasklist">
		<h2 class="name">
			<div
				ref="listNameRef"
				contenteditable="plaintext-only"
				@blur="onListNameUpdate"
				@keydown.enter="listNameRef.blur"
				@keydown.escape="listNameRef.blur"
			>
				{{ card.content.title }}
			</div>
		</h2>
		<ul>
			<li
				v-for="task, index in card.content.tasks"
				:key="task"
				:class="{ done: task.done }"
				:style="{
					textDecoration: task.done ? 'line-through' : 'none',
					opacity: task.done ? .5 : 1
				}"
			>
				<input
					type="checkbox"
					:value="task.done"
					@change="toggleTask($event, index)"
				>
				{{ task.content }}
			</li>
		</ul>
		<input
			ref="inputRef"
			v-model="newTodo"
			placeholder="+ Add task"
			@keydown.enter="addTask"
			@keydown.escape="inputRef.blur"
		>
	</div>
</template>

<script setup lang="ts">
const props = defineProps(['card'])
const emit = defineEmits(['contentUpdate'])
const { card } = props
const listNameRef = ref()
const inputRef = ref()
const newTodo = ref()

function onListNameUpdate() {
	card.content.title = listNameRef.value.textContent

	emit('contentUpdate', true)
}

function addTask() {
	if (newTodo.value.length > 0) {
		card.content.tasks.push({
			content: newTodo.value,
			done: false
		})

		newTodo.value = ''

		return emit('contentUpdate', true)
	}
}

function toggleTask(event: Event, index: number) {
	card.content.tasks[index].done = (event.target as HTMLInputElement).checked

	card.content.tasks = card.content.tasks.filter((task: { done: boolean }) => task.done === false)

	return emit('contentUpdate', true)
}

function activate() {
	inputRef.value.focus()
}

defineExpose({ activate })
</script>
