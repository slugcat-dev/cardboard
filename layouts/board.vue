<template>
	<div id="app">
		<BoardSidebar />
		<BoardHeader />
		<NuxtPage />
		<ContextMenu />
	</div>
</template>

<style lang="scss">
/* stylelint-disable declaration-block-no-redundant-longhand-properties */

body {
	overflow: hidden;
}

#app {
	position: relative;
	display: grid;
	grid-template-areas:
		'sidebar header'
		'sidebar main';
	grid-template-rows: 41px auto;
	grid-template-columns: min-content auto;
	height: 100vh;

	.canvas-transition-wrapper {
		position: relative;
		grid-area: main;
	}
}
</style>
