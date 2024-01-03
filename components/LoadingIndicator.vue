<script setup lang="ts">
const { progress, isLoading } = useLoadingIndicator()
</script>

<template>
	<div
		class="loading-indicator"
		:style="{ height: isLoading ? '2.75rem' : 0 }"
	>
		<div :style="{ width: `${progress}%` }" />
	</div>
</template>

<style lang="scss">
.loading-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: calc(100vw - .5rem);
	margin: .25rem;
  background-color: var(--color-accent-25);
  border-radius: .375rem;
	transition: .2s;
  z-index: 15;

  div {
    height: inherit;
    background: var(--color-accent);
    border-radius: inherit;
    transition: width .2s;
  }
}
</style>
