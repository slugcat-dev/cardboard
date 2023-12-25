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
			max-width: 213px;
			padding: .125rem .25rem;
			background-color: #fff1;
			border-radius: .25rem;

			button {
				float: right;
			}
		}
	}

	input {
		margin-right: .25rem;
	}
}
</style>

<template>
	<div class="tasklist">
		<h2>
			<div
				ref="listNameRef"
				contenteditable="plaintext-only"
				@blur="onListNameUpdate"
				@keydown.enter="listNameRef.blur"
				@keydown.escape="listNameRef.blur"
			>
				{{ card.content.title }}
			</div>
			<button @click="clearDoneTasks">
				Clear
			</button>
		</h2>
		<div class="text-secondary">
			Task list cards are in development
		</div>
		<ul>
			<li
				v-for="task, index in card.content.tasks"
				:key="task"
				:style="{
					textDecoration: task.done ? 'line-through' : 'none',
					opacity: task.done ? .5 : 1
				}"
			>
				{{ task.content }}
				<button @click="toggleTask(index)">
					{{ index }}
				</button>
			</li>
		</ul>
		<input
			ref="inputRef"
			v-model="newTodo"
			placeholder="Add task"
			@keydown.enter="addTodo"
			@keydown.escape="inputRef.blur"
		>
		<button @click="addTodo">
			+
		</button>
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

function addTodo() {
	if (newTodo.value.length > 0) {
		card.content.tasks.push({
			content: newTodo.value,
			done: false
		})

		newTodo.value = ''

		return emit('contentUpdate', true)
	}
}

function toggleTask(index: number) {
	card.content.tasks[index].done = !card.content.tasks[index].done

	return emit('contentUpdate', true)
}

function clearDoneTasks() {
	card.content.tasks = card.content.tasks.filter((task: { done: boolean }) => task.done === false)

	return emit('contentUpdate', true)
}

function activate() {
	inputRef.value.focus()
}

defineExpose({ activate })
</script>
