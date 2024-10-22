const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	let schema = mongoose.Schema(
		{
			itemType: { type: ObjectId, ref: 'itemTypes', default: null, index: true },
			name: { type: String, unique: true },
			description: { type: String, default: '' },
			tags: [{ type: String, index: true }]
		},
		{ versionKey: false, timestamps: true }
	)

	schema.pre('save', (next) => {
		this.updatedAt = new Date()
	})
	schema.pre('remove', (next) => next())
	schema.pre('remove', true, (next, done) => next())
	schema.on('init', (model) => { })
	schema.plugin(mongoosePaginate)

	let model = dbModel.conn.model(collectionName, schema, collectionName)

	model.removeOne = (session, filter) => sendToTrash(dbModel, collectionName, session, filter)
	return model
}
