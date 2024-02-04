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
		}],
		parent: {
			type: Schema.Types.ObjectId,
			ref: 'Board',
			required: false
		},
		fav: {
			type: Boolean,
			required: false
		}
	},
	options: {
		timestamps: true,
		toJSON: { virtuals: true }
	}
})
