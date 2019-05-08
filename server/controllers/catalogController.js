'use strict'

const app = require('../server')
app.on('started', function () {
    const HomeCatalog = app.models.Homecatalog;
    const RoomCatalog = app.models.Roomcatalog;
    const Q = require('q');
    const forEach = require('async-foreach').forEach;
    const constant = require('../constants')

    const deleteMulti = (model, listId) =>
        new Promise((resolve, reject) => {
            let subModel;
            console.log(model.modelName)
            if (model.modelName == 'HomeCatalog') {
                subModel = app.models.Homes;
            } else {
                subModel = app.models.Rooms;
            }
            let promises = [];
            forEach(listId, (id, index) => {
                let filter;
                if (subModel.modelName == 'Homes') {
                    filter = Object.assign({}, filter, { homeTypeId: id })
                } else {
                    filter = Object.assign({}, filter, { roomTypeId: id })
                }
                subModel.findOne({ where: filter })
                    .then(subModelItem => {
                        console.log('subModelItem', subModelItem)
                        if (!subModelItem) {
                            promises.push(model.destroyAll({ id: id }))
                        }
                    })
            })
            if (listId.length == promises.length) {
                Q.all(promises)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            } else {
                reject('cannot delete catalog included instance')
            }
        })

    exports.deleteMulti = deleteMulti
});