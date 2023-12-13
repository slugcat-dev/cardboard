type Position = {
	x: number
	y: number
}

type Card = {
	_id: string
	type: 'text' | 'link' | 'image' | 'tasklist'
	created: Date
	position: Position
	content: any
}

type Board = {
	_id: string
	name: string
	owner: string
	cards: Card[]
}

type User = {
	id: number
	name: string
	picture: string
}
