const app = require('../server')
app.on('started', function () {
    const CommonResponse = require('../common/common_response');
    const forEach = require('async-foreach').forEach;
    const Q = require('q');
    const mongoose = require('mongoose')
    const home_extraFee = app.models.home_extraFee;

    const createUtilities = (model, name, description, icon_link, userId, isActive) =>
        new Promise((resolve, reject) => {
            model.findOne({ where: { name: name } })
                .then(modelItem => {
                    if (modelItem) {
                        reject({ err: true })
                    }
                    else {
                        model.create({
                            name: name,
                            description: description,
                            icon_link: icon_link,
                            isActive: isActive,
                            create_by: userId,
                            create_at: new Date(),
                            update_by: userId,
                            update_at: new Date()
                        })
                            .then(newModel => {
                                resolve(newModel)
                            })
                            .catch(err => {
                                reject({ err: err })
                            })
                    }
                })

        })

    const getAllUtilities = (model, skip, limit, name, isActive, searchText) =>
        new Promise((resolve, reject) => {
            var filter = {};
            if (name) {
                filter = Object.assign({}, filter, { name: name })
            }
            if (isActive != null) {
                filter = Object.assign({}, filter, { isActive: { inq: isActive } })
            }
            if (searchText) {
                filter = Object.assign({}, filter, {
                    or: [
                        { name: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                        { description: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }
                    ]
                })
            }
            console.log('filter', filter)
            model.find({
                where: filter, order: 'update_at DESC', include: {
                    relation: "update_by",
                    scope: {
                        fields: ['userName', 'email']
                    }
                }
            })
                .then(models => {
                    var temp = models.slice(skip, skip + limit);
                    var response = new CommonResponse(true, "list models on page ", temp);
                    console.log('responses ' + response);
                    response = Object.assign({}, response, { count: models.length })
                    resolve(response)
                })
                .catch(err => {
                    reject(err)
                })
        })

    const updateUtilities = (model, id, name, description, isActive, userId) =>
        new Promise((resolve, reject) => {
            model.findById(id)
                .then(modelItem => {
                    modelItem.updateAttributes({ name: name, description: description, isActive: isActive, update_by: mongoose.Types.ObjectId(userId) })
                        .then(modelItemUpdated => {
                            let response = new CommonResponse(true, 'modelItemUpdated ', modelItemUpdated);
                            resolve(response)
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
        })

    const deleteMulti = (model, listModelId) =>
        new Promise((resolve, reject) => {
            let promises = [];
            forEach(listModelId, (item, index) => {
                promises.push(
                    model.destroyAll({ id: item })
                )
            })
            Q.all(promises)
                .then(result => {
                    resolve(result)
                })
                .catch(err => {
                    reject(err)
                })
        })
    exports.deleteMulti = deleteMulti
    exports.updateAttributes = updateUtilities
    exports.getAllUtilities = getAllUtilities
    exports.createUtilities = createUtilities
})