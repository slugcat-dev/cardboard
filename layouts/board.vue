<template>
	<div class="app-layout">
		<BoardSidebar />
		<BoardHeader />
		<slot />
		<ContextMenu />
	</div>
</template>

<style lang="scss">
/* stylelint-disable declaration-block-no-redundant-longhand-properties */

body {
	overflow: hidden;
}

.header-loader {
	width: 500px;
	height: 1rem;
	border-radius: .25rem;
}

.skeleton-loader {
	background: linear-gradient(
		to right,
		#8882 0%,
		#8884 25%,
		#8882 50%
	);
  background-size: 400vw 100vh;
  background-attachment: fixed;
  animation: pulse .8s linear infinite;
}

@keyframes pulse {
  0% { background-position: 0 0; }
  100% { background-position: 400vw 0; }
}

.app-layout {
	position: relative;
	display: grid;
	grid-template-areas:
		'sidebar header'
		'sidebar main';
	grid-template-rows: 41px auto;
	grid-template-columns: min-content auto;
	height: 100vh;
}

#header {
	z-index: 10;
	display: flex;
	gap: 1rem;
	align-items: center;
	padding: .5rem 1rem;
	background-color: var(--color-background-secondary);
	border-bottom: 1px solid var(--color-border);
	box-shadow: 0 2px 4px var(--color-shadow-ui);
  clip-path: inset(0 0 -6px 0);
	user-select: none;
}
</style>
