const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	let schema = mongoose.Schema(
		{
			name: { type: String, unique: true },
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
