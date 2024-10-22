const mikroHelper = require('../../lib/mikro/mikroHelper')

module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    if (!['GET', 'PATCH'].includes(req.method) && !sessionDoc) {
      return restError.session(req, reject)
    }

    switch (req.method.toUpperCase()) {
      case 'GET':
        if (req.params.param1 == 'summary') {
          getSummary(dbModel, sessionDoc, req).then(resolve).catch(reject)
        } else {
          getList(dbModel, sessionDoc, req).then(resolve).catch(reject)
        }

        break

      default:
        restError.method(req, reject)
        break
    }
  })

function getList(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      const lastDate = req.getValue('lastDate') || new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().substring(0, 10)
      if (!lastDate) return reject(`lastDate required`)
      const ayarlar = await dbModel.settings.findOne({ member: sessionDoc.member })
      if (!ayarlar) return reject(`settings not found`)
      if (ayarlar.connector.connectionType == 'mssql') {
        if (ayarlar.connector.mssql.mainApp == 'mikro_v16' || ayarlar.connector.mssql.mainApp == 'mikro_v17') {
          mikroHelper.kasaBakiyeleri(dbModel, sessionDoc, ayarlar.connector, lastDate)
            .then(async result => {
              resolve(result)
            })
            .catch(reject)
        } else {
          reject('module is not ready yet.')
        }
      } else {
        reject('module is not ready yet.')
      }

    } catch (err) {
      reject(err)
    }

  })
}

function getSummary(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      const lastDate = req.getValue('lastDate') || util.yesterday()
      if (!lastDate) return reject(`lastDate required`)
      const ayarlar = await dbModel.settings.findOne({ member: sessionDoc.member })
      if (!ayarlar) return reject(`settings not found`)
      if (ayarlar.connector.connectionType == 'mssql') {
        if (ayarlar.connector.mssql.mainApp == 'mikro_v16' || ayarlar.connector.mssql.mainApp == 'mikro_v17') {
          mikroHelper.kasaBakiyeleriOzet(dbModel, sessionDoc, ayarlar.connector, lastDate)
            .then(async result => {
              resolve(result)
            })
            .catch(reject)
        } else {
          reject('module is not ready yet.')
        }
      } else {
        reject('module is not ready yet.')
      }

    } catch (err) {
      reject(err)
    }

  })
}