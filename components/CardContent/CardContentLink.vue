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

<template>
	<div class="card-link-embed">
		<div class="image-container">
			<img
				v-if="card.content.favicon"
				class="icon-glow"
				:src="card.content.favicon"
				draggable="false"
				loading="lazy"
			>
			<img
				v-if="card.content.favicon"
				class="icon"
				:src="card.content.favicon"
				draggable="false"
				loading="lazy"
			>
			<Icon
				v-else
				name="mdi:earth"
				class="icon missing"
			/>
		</div>
		<div class="text-content">
			<NuxtLink
				class="title text-strong"
				:to="card.content.url"
				target="_blank"
			>
				{{ title }}
			</NuxtLink>
			<div class="description text-secondary">
				{{ description }}
			</div>
		</div>
	</div>
</template>

<style lang="scss">
.card-link-embed {
	display: flex;
	width: 274px;
	padding: calc(.5rem - 1px);
	gap: .5rem;
	align-items: center;

	.image-container {
		position: relative;
		width: 1.75rem;
		height: 1.75rem;
		padding: .375rem;
		background-color: var(--color-favicon);
		border-radius: .5rem;
		box-shadow: 0px 0px 4px var(--color-icon-shadow);

		&:has(.missing) {
			background-color: var(--color-accent-25);
		}

		.icon-glow {
			position: absolute;
			top: 0;
			left: 0;
			width: 1.75rem;
			height: 1.75rem;
			border-radius: .5rem;
			filter: blur(16px) contrast(var(--icon-contrast, 1)) saturate(2);
			clip-path: fill-box;
			-webkit-touch-callout: none;
		}

		.icon {
			display: block;
			width: 1rem;
			height: 1rem;
			border-radius: .125rem;
			filter: drop-shadow(0px 0px 4px var(--color-icon-shadow));
			-webkit-touch-callout: none;
		}
	}

	.text-content {
		display: flex;
		width: calc(100% - 2.5rem);
		flex-direction: column;
		font-size: .875rem;

		.title,
		.description {
			width: fit-content;
			max-width: 100%;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.title {
			color: var(--color-text);

			&:not(:hover, :focus-visible) {
				text-decoration: none;
			}
		}

	}
}
</style>
