module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {

    switch (req.method.toUpperCase()) {
      case 'GET':
        if (req.params.param1 != undefined) {
          getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)
        } else {
          getList(dbModel, sessionDoc, req).then(resolve).catch(reject)
        }
        break
      case 'POST':
        // if (req.params.param1 == 'setInvoice') {

        // } else if (req.params.param1 == 'setShipping') {

        // } else {
        post(dbModel, sessionDoc, req).then(resolve).catch(reject)
        // }


        break
      case 'PUT':
        put(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      case 'DELETE':
        deleteItem(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      default:
        restError.method(req, reject)
        break
    }
  })

// function setInvoice(dbModel, sessionDoc, req) {
//   return new Promise((resolve, reject) => {
//     dbModel.addresses
//       .findOne({ _id: req.params.param1 })
//       .then(resolve)
//       .catch(reject)
//   })
// }
function getOne(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    dbModel.addresses
      .findOne({ _id: req.params.param1 })
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let options = {
      page: req.query.page || 1,
      limit: req.query.pageSize || 10,
    }
    let filter = {}
    if (req.query.firm)
      filter.firm = req.query.firm
    if (req.query.search) {
      filter.$or = [
        { streetName: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { buildingName: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { citySubdivisionName: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { cityName: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { region: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { district: { $regex: `.*${req.query.search}.*`, $options: 'i' } },
        { 'country.name': { $regex: `.*${req.query.search}.*`, $options: 'i' } },
      ]
    }

    dbModel.addresses
      .paginate(filter, options)
      .then(resolve).catch(reject)
  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      let data = req.body || {}
      delete data._id
      if (!data.firm) return reject('firm required')
      if (!data.name) return reject('name required')
      let firmDoc = await dbModel.firms.findOne({ _id: data.firm })
      if (!firmDoc) return reject(`firm not found`)

      if (await dbModel.addresses.countDocuments({ firm: firmDoc._id, name: data.name }) > 0)
        return reject(`name already exists`)
      const newDoc = new dbModel.addresses(data)

      if (!epValidateSync(newDoc, reject)) return

      newDoc.save()
        .then(async newDoc => {

          resolve(newDoc)
        })
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function put(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      if (req.params.param1 == undefined) return restError.param1(req, reject)
      let data = req.body || {}
      delete data._id
      delete data.firm

      let doc = await dbModel.addresses.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)

      doc = Object.assign(doc, data)
      if (!epValidateSync(doc, reject)) return
      if (await dbModel.addresses.countDocuments({ name: doc.name, _id: { $ne: doc._id } }) > 0)
        return reject(`name already exists`)

      doc.save()
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function deleteItem(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.params.param1 == undefined) return restError.param1(req, reject)
      // const addressDoc = await dbModel.addresses.findOne({ _id: req.params.param1 })
      // if (!addressDoc) return reject(`address not found`)
      // let firmDoc = await dbModel.firms.findOne({ _id: addressDoc.firm })
      // if (!firmDoc) return reject(`firm not found`)

      // const otherAddrList = await dbModel.addresses.find({ firm: addressDoc.firm, _id: { $ne: addressDoc._id } }).select('_id name')
      // console.log('addressDoc._id:', addressDoc._id)
      // if (otherAddrList.length == 0) {
      //   firmDoc.address = null
      //   firmDoc.shippingAddress = null
      //   await firmDoc.save()
      // } else {
      //   console.log(`otherAddrList:`, otherAddrList)
      //   if (firmDoc.address.toString() == addressDoc._id.toString()) {
      //     firmDoc.address = otherAddrList[0]._id
      //     await firmDoc.save()
      //   }
      //   if (firmDoc.shippingAddress.toString() == addressDoc._id.toString()) {
      //     firmDoc.shippingAddress = otherAddrList[0]._id
      //     await firmDoc.save()
      //   }
      // }

      dbModel.addresses.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(resolve)
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}
