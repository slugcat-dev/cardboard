import { defineMongooseModel } from '#nuxt/mongoose'

export const CardSchema = defineMongooseModel({
	name: 'Card',
	schema: {
		type: {
			type: String,
			required: true
		},
		position: {
			x: {
				type: Number,
				required: true
			},
			y: {
				type: Number,
				required: true
			}
		},
		content: {
			type: Object,
			required: true
		}
	},
	options: {
		timestamps: true,
		toJSON: { virtuals: true }
	}
})
