interface Pos {
	x: number
	y: number
}

interface PointerData {
	type: string | null
	down: Pos | false
	pos: Pos
	moved: boolean
	gesture?: boolean
	offset?: Pos & { zoom: number }
}

interface CardSelection {
	rect: DOMRect | null
	cards: Card[]
	visible: boolean
	clear: () => void
}
