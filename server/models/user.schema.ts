import { defineMongooseModel } from '#nuxt/mongoose'

export const UserSchema = defineMongooseModel({
	name: 'User',
	schema: {
		email: {
			type: String,
			required: true
		},
		google: {
			type: String,
			required: false
		},
		github: {
			type: Number,
			required: false
		},
		lastseen: {
			type: Date,
			required: false
		}
	},
	options: { toJSON: { virtuals: true } }
})
