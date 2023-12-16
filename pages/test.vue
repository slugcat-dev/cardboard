<style>
.loading {
  font-size: 2rem;
}
</style>

<template>
	<ClientOnly>
		<template #fallback>
			<div class="loading">
				<Icon name="svg-spinners:ring-resize" />
				Loading
			</div>
		</template>
		<div ref="someRef" class="content">
			This text should NOT be large!
			Remove the <pre>ref="someRef"</pre> from the parent and it works
			<a href="https://github.com/nuxt-modules/icon/issues/129">Issue on GitHub</a>
		</div>
	</ClientOnly>
</template>
