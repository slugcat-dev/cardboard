<script setup lang="ts">
import Fuse from 'fuse.js'
import type { FuseResult } from 'fuse.js'

const inp = ref()
const filteredCards: Ref<FuseResult<Card>[]> = ref([])

const data = await useFetch<{ cards: Card[] }>(`/api/boards/66a524b72995ab193bc6f734`, { method: 'GET', pick: ['cards'] })
const cards = data.data.value?.cards as Card[]
// TODO: vueuse useFuse
const fuse = new Fuse(cards, {
	keys: ['content'],
	distance: Math.max(...cards?.map(c => c.content.length))
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
			:key="card.item.id"
			:style="{ borderBottom: '1px solid grey' }"
		>
			<CardContentText :card="card.item" />
		</div>
	</div>
</template>
