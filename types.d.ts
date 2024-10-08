interface Position {
	x: number
	y: number
}

interface Card {
	id: string
	type: 'text' | 'link' | 'image' | 'tasklist' | 'board'
	position: Position
	content: any
	createdAt?: Date
	updatedAt?: Date
}

interface Board {
	id: string
	name: string
	owner: string
	cards: Card[]
	parent?: string
	fav?: boolean
	createdAt: Date
	updatedAt?: Date
}

interface User {
	id: string
	email: string
	name: string
	picture: string
	createdAt: Date
}

declare module '#auth-utils' {
	interface UserSession {
		user: Omit<User, 'createdAt'>
	}
}
