type Position = {
	x: number
	y: number
}

type Card = {
	id: string
	type: 'text' | 'link' | 'image' | 'tasklist'
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

declare module '#auth-utils' {
	type UserSession = {
		user: User
	}
}
