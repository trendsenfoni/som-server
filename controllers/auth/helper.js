const auth = require('../../lib/auth')
const { ObjectId } = require('mongodb')
exports.saveSession = async function (memberDoc, role, req, loginProvider = 'aliabi', oauth2 = null) {
	let deviceId = req.getValue('deviceId') || ''
	let lang = req.getValue('lang') || ''
	let oldSessions = []
	try {
		oldSessions = await db.sessions
			.find({ member: memberDoc._id })
			.sort({ _id: -1 })
			.limit(1)

		const closeResult = await db.sessions.updateMany(
			{ member: memberDoc._id, deviceId: deviceId, closed: false },
			{ $set: { closed: true } },
			{ multi: true }
		)

	} catch (err) {
		console.error('saveSession err:', err)
	}

	return new Promise(async (resolve, reject) => {
		try {
			let oldDb = ''
			let oldFirm = ''
			let oldPeriod = ''
			let oldDbList = []
			if (oldSessions.length > 0) {
				if (!lang) lang = oldSessions[0].lang
				oldDb = oldSessions[0].db
				oldFirm = oldSessions[0].firm
				oldPeriod = oldSessions[0].period
				oldDbList = oldSessions[0].dbList
			}
			let sessionDoc = new db.sessions({
				member: memberDoc._id,
				loginProvider: loginProvider,
				username: memberDoc.username,
				email: memberDoc.email,
				phoneNumber: memberDoc.phoneNumber,
				role: role,
				db: oldDb || '',
				firm: oldFirm || '',
				period: oldPeriod || '',
				dbList: oldDbList || [],
				deviceId: deviceId,
				IP: req.IP || '',
				lastIP: req.IP || '',
				closed: false,
				lang: lang || 'tr',
				oauth2: oauth2,
				requestHeaders: req.headers
			})


			sessionDoc
				.save()
				.then(async (newDoc) => {
					let obj = {
						token: 'AABI_' + auth.sign({ sessionId: newDoc._id.toString() }),
						db: newDoc.db,
						firm: newDoc.firm,
						period: newDoc.period,
						dbList: newDoc.dbList,
						lang: newDoc.lang,
						user: memberDoc.toJSON(),
					}
					delete obj.user.password
					resolve(obj)
				})
				.catch(reject)
		} catch (err) {
			reject(err)
		}

	})
}

exports.socialLogin = async function (req,
	loginProvider, email, name, firstName, lastName, imageUrl,
	oauth2Data, gender = '') {
	return new Promise(async (resolve, reject) => {
		try {
			let memberDoc = await db.members.findOne({ email: email })
			if (!memberDoc) {
				const userId = new ObjectId()
				memberDoc = new db.members({
					_id: userId,
					username: userId.toString(),
					email: email,
					phoneNumber: null,
					role: 'user',
					fullName: `${firstName} ${lastName}`,
					firstName: firstName,
					lastName: lastName,
					gender: gender,
					dateOfBirth: '',
					image: imageUrl,
					bio: '',
					passive: false
				})
			} else {
				if (memberDoc.passive) return reject(`user is not active`)
				memberDoc.fullName = `${firstName} ${lastName}`
				memberDoc.firstName = firstName
				memberDoc.lastName = lastName
				memberDoc.image = imageUrl
				if (memberDoc.gender != gender) memberDoc.gender = gender
			}

			if (!epValidateSync(memberDoc, reject)) return
			memberDoc
				.save()
				.then(newDoc => {
					exports.saveSession(newDoc, 'user', req, loginProvider, oauth2Data)
						.then(resolve)
						.catch(reject)
				})
				.catch(err => {
					console.error('hata:', err)
					reject(err)
				})


		} catch (err) {
			reject(err)
		}
	})
}

exports.magicLinkLogin = async function (req, email) {
	return new Promise(async (resolve, reject) => {
		try {
			let memberDoc = await db.members.findOne({ email: email })
			if (!memberDoc) {
				const userId = new ObjectId()
				memberDoc = new db.members({
					_id: userId,
					username: userId.toString(),
					email: email,
					phoneNumber: null,
					role: 'user',
					fullName: ``,
					firstName: '',
					lastName: '',
					gender: '',
					dateOfBirth: '',
					image: '',
					bio: '',
					passive: false
				})
			} else {
				if (memberDoc.passive) return reject(`user is not active`)
			}

			if (!epValidateSync(memberDoc, reject)) return

			memberDoc
				.save()
				.then(newDoc => {
					exports.saveSession(newDoc, 'user', req, 'magiclink', null)
						.then(resolve)
						.catch(reject)
				})
				.catch(err => {
					console.error('hata:', err)
					reject(err)
				})


		} catch (err) {
			reject(err)
		}
	})
}