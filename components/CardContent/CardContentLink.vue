<style lang="scss">
.card-link-embed {
	width: 254px;
	padding: calc(.5rem - 1px);

	.image {
		display: block;
		width: 100%;
		margin-bottom: .5rem;
		border-radius: .25rem;
	}

	.title > a,
	.description {
		width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.title {
		display: flex;
		gap: .5rem;
		font-size: .875rem;

		.favicon {
			width: 1rem;
			height: 1rem;

			&.missing {
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: var(--color-blue-40);
				border-radius: 100%;

				& >	svg {
					vertical-align: middle;
					width: .75rem;
					height: .75rem;
				}
			}
		}

		& > a {
			width: calc(100% - 1.5rem);
			color: var(--color-text);

			&:not(:hover, :focus-visible) {
				text-decoration: none;
			}
		}

	}
}
</style>

<template>
	<div class="card-link-embed">
		<img
			v-if="card.content.domain.includes('youtu')"
			class="image"
			:src="card.content.image"
			draggable="false"
			loading="lazy"
		>
		<div class="title">
			<img
				v-if="card.content.favicon"
				class="favicon"
				:src="card.content.favicon"
				draggable="false"
				loading="lazy"
			>
			<div
				v-else
				class="favicon missing"
			>
				<Icon name="mdi:earth" />
			</div>
			<NuxtLink
				class="text-strong"
				:to="card.content.url"
				target="_blank"
			>
				{{ title }}
			</NuxtLink>
		</div>
		<div class="description text-secondary">
			{{ description }}
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps(['card'])
const { card } = props

const title = computed(() => {
	return `${card.content.siteName && !card.content.title.includes(card.content.siteName) ? `${card.content.siteName} - ` : ''}${card.content.title || card.content.domain}`
})

const description = computed(() => {
	return card.content.description || (card.content.title ? card.content.domain : card.content.url)
})
</script>
