<template>
	<div class="app-layout">
		<BoardSidebar />
		<BoardHeader />
		<slot />
	</div>
</template>

<style>
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
</style>
