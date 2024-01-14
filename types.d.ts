type Position = {
	x: number
	y: number
}

type Card = {
	id: string
	type: 'text' | 'link' | 'image' | 'tasklist' | 'board'
	created: Date
	position: Position
	content: any
}

type Board = {
	id: string
	name: string
	owner: string
	cards: Card[]
}

type User = {
	id: string
	name: string
	picture: string
}

type Bread = {
	path: string
	name: string
}

type ContextMenuEntry = {
	name: string
	handler: Function
	role?: 'danger'
}

type ContextMenuOptions = {
	position: Position
	entries: ContextMenuEntry[]
}

declare module '#auth-utils' {
	type UserSession = {
		user: User
	}
}
