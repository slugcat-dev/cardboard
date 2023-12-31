import { Schema } from 'mongoose'
import { defineMongooseModel } from '#nuxt/mongoose'

export const BoardSchema = defineMongooseModel({
	name: 'Board',
	schema: {
		name: {
			type: String,
			required: true
		},
		owner: {
			type: String,
			required: true
		},
		cards: [{
			type: Schema.Types.ObjectId,
			ref: CardSchema
		}]
	},
	options: { toJSON: { virtuals: true } }
})
