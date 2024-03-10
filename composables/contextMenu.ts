export interface ContextMenuItem {
	name: string
	icon: string
	handler: Function
}

export const contextMenu = reactive({
	position: { x: 0, y: 0 },
	items: [] as ContextMenuItem[],
	visible: false
})

export function showContextMenu(position: Position, items: ContextMenuItem[]) {
	contextMenu.position = position
	contextMenu.items = items
	contextMenu.visible = true
}
