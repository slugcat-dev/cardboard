type Position = {
	x: number
	y: number
}

type Card = {
	id: string
	type: 'text' | 'link' | 'image' | 'tasklist' | 'board'
	position: Position
	content: any
	createdAt: Date
	updatedAt: Date
}

type Board = {
	id: string
	name: string
	owner: string
	parent?: string
	cards: Card[]
	createdAt: Date
	updatedAt: Date
}

type User = {
	id: string
	email: string
	name: string
	picture: string
	createdAt: Date
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
