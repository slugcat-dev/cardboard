<script setup lang="ts">
import Fuse from 'fuse.js'
import type { FuseResult } from 'fuse.js'

const inp = ref()
const cards: Ref<Card[]> = ref([])
const filteredCards: Ref<FuseResult<Card>[]> = ref([])

const { data } = await useFetch(`/api/boards/656f53626c5e6f901b94ec14`, { method: 'GET' })
const board = data.value as Board

cards.value = board.cards as Card[]

const fuse = new Fuse(cards.value, {
	includeScore: true,
	ignoreLocation: true,
	keys: [
		'content',
		'content.title',
		'content.description',
		'content.url',
		'content.tasks.content'
	]
})

function onInput() {
	filteredCards.value = fuse.search(inp.value)
}
</script>

<template>
	<div>
		<input
			v-model="inp"
			type="text"
			@input="onInput"
		>
		<div
			v-for="card in filteredCards"
			:key="card.item.created.toString()"
			:style="{ borderBottom: '1px solid grey' }"
		>
			{{ card.item.content }}
			<div style="opacity: .5">
				{{ card.score }}
			</div>
		</div>
	</div>
</template>
