<script setup lang="ts">
const { progress, isLoading } = useLoadingIndicator()
</script>

<template>
	<div
		class="loading-indicator"
		:style="{ height: isLoading ? '2px' : 0 }"
	>
		<div :style="{ width: `${progress}%` }" />
	</div>
</template>

<style lang="scss">
.loading-indicator {
  position: fixed;
  z-index: 15;
  width: 100vw;
  background-color: var(--color-background-secondary);
	transition: all .2s;

  div {
    height: inherit;
    background: var(--color-accent);
    border-radius: inherit;
    transition: width .2s;
  }
}
</style>
