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
	event.target.parentElement.style.setProperty('--height', `${event.target.parentElement.clientHeight}px`)

	card.content.tasks[index].done = (event.target as HTMLInputElement).checked
	const empty = card.content.tasks.length - 1 === 0

	setTimeout(() => {
		if (!empty)
			card.content.tasks = card.content.tasks.filter((task: { done: boolean }) => task.done === false)

		emit('contentUpdate', true, empty)
	}, empty ? 600 : 1000)
}

function activate() {
	inputRef.value.focus()
}

defineExpose({ activate })
</script>

<template>
	<div class="tasklist">
		<h2 class="name">
			<div
				ref="listNameRef"
				contenteditable="plaintext-only"
				@blur="onListNameUpdate"
				@keydown.enter="listNameRef.blur"
				@keydown.escape="(e) => { e.stopPropagation(); listNameRef.blur(); }"
			>
				{{ card.content.title }}
			</div>
		</h2>
		<ul>
			<li
				v-for="task, index in card.content.tasks"
				:key="task"
				:class="{ done: task.done }"
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
			@keydown.escape="(e) => { e.stopPropagation(); inputRef.blur(); }"
		>
	</div>
</template>

<style lang="scss">
.tasklist {
	padding: .5rem;

	.name {
		margin: 0;
		font-size: 1.125rem;
	}

	input {
		width: 100%;
		margin-right: .25rem;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: .25rem;
		max-width: 258px;
		margin: .5rem 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			gap: .5rem;
			align-items: flex-start;
			padding: .5rem;
			font-size: .875rem;
			word-break: break-word;
			background-color: var(--color-background-tertiary);
			border-radius: .25rem;

			&.done:not(:only-child) {
				margin-top: calc((var(--height) + .25rem) * -1);
				overflow: clip;
				transform: scale(.75);
				opacity: 0;
				transition: .2s .6s, margin-top .2s .8s;
			}

			& input {
				position: relative;
				width: .875rem;
				min-width: .875rem;
				height: .875rem;
				margin: 0;
				margin-top: .125rem;
				border: 1px solid gray;
				border-radius: 100%;
				cursor: pointer;
				appearance: none;

				&::before {
					position: absolute;
					border: 2px dotted var(--color-good);
					border-radius: 100%;
					visibility: hidden;
					content: '';
					inset: 0;
				}

				&:checked {
					background-color: var(--color-good);
					transition: background-color .2s;

					&::before {
						visibility: visible;
						opacity: 0;
						transition: .4s, opacity .2s .2s;
						inset: -.5rem;
					}
				}
			}

		}
	}
}
</style>
