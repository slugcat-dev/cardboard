<template>
	<div id="board">
		<BoardSidebar />
		<div class="board-main">
			<BoardHeader />
			<div class="canvas-transition-wrapper">
				<slot />
			</div>
		</div>
	</div>
</template>

<style lang="scss">
body {
	overflow: hidden;
}

#board {
	display: flex;
	height: 100vh;

	.board-main {
		display: flex;
		flex-direction: column;
		flex-grow: 1;

		.canvas-transition-wrapper {
			position: relative;
			flex-grow: 1;
		}
	}
}
</style>
