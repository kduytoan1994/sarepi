'use strict';
const CommonResponse = require('../../server/common/common_response');
const catalogController = require('../../server/controllers/catalogController')

module.exports = function (Roomcatalog) {

    Roomcatalog.validatesUniquenessOf('catalogName')

    Roomcatalog.createRoomCatalog = (catalogName, catalogDescription, userId, isActive, res) => {
        Roomcatalog.find({ where: { catalogName: catalogName } })
            .then(roomCatalogs => {
                console.log('roomCatalog', roomCatalogs)
                if (roomCatalogs.length > 0) {
                    console.log('catalog name is existed!')
                    res.status(400).json(new CommonResponse(false, 'catalog name is existed!', 'catalog name is existed!'))
                } else {
                    Roomcatalog.create({
                        catalogName: catalogName,
                        catalogDescription: catalogDescription,
                        create_by: userId,
                        isActive: isActive,
                        create_at: new Date(),
                        update_by: userId,
                        update_at: new Date()
                    })
                        .then(roomCatalog => {
                            let response = new CommonResponse(true, 'roomCatalog ', roomCatalog);
                            res.json(response).end();
                        })
                        .catch(err => {
                            let response = new CommonResponse(false, 'cannot create room catalog', err);
                            res.status(400).json(response).end();
                        })
                }
            })

    }

    Roomcatalog.getAllRoomCatalogs = (skip, limit, name, isActive, searchText, res, req) => {
        var filter = {};
        if (name) {
            filter = Object.assign({}, filter, { catalogName: name })
        }
        if (isActive != null) {
            filter = Object.assign({}, filter, { isActive: { inq: isActive } })
        }
        if (searchText) {
            filter = Object.assign({}, filter, { catalogName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } })
        }
        console.log(filter)
        Roomcatalog.find({
            where: filter, order: 'update_at DESC', include: [{
                relation: "create_by",
                scope: {
                    fields: ['userName', 'email']
                }
            }, {
                relation: "update_by",
                scope: {
                    fields: ['userName', 'email']
                }
            }]
        })
            .then(roomCatalogs => {
                var temp = roomCatalogs.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list roomCatalogs on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: roomCatalogs.length })
                res.json(response).end();
            })
    }

    Roomcatalog.updateRoomcatalog = (id, catalogName, catalogDescription, isActive, userId, res) => {
        Roomcatalog.findById(id)
            .then(roomCatalog => {
                roomCatalog.updateAttributes({ catalogName: catalogName, catalogDescription: catalogDescription, isActive: isActive, update_by: userId })
                    .then(roomCataloglogResult => {
                        let response = new CommonResponse(true, 'roomCatalog ', roomCataloglogResult);
                        res.json(response).end();
                    })
                    .catch(err => {
                        let response = new CommonResponse(false, 'cannot update room catalog', err);
                        res.status(422).json(response).end();
                    })
            })
    }

    Roomcatalog.deleteCatalog = (id, res) => {
        Roomcatalog.app.models.Rooms.find({ where: { roomTypeId: id } })
            .then(roomCatalogs => {
                if (roomCatalogs.length > 0) {
                    let response = new CommonResponse(false, 'please delete all rooms in this room catalog ', '');
                    res.status(400).json(response).end();
                } else {
                    Roomcatalog.destroyAll({ id: id })
                        .then(result => {
                            let response = new CommonResponse(true, 'delete success', result);
                            res.json(response).end();
                        })
                }
            })
            .catch(err => {
                let response = new CommonResponse(true, 'delete fail', err);
                res.status(400).json(response).end();
            })
    }

    Roomcatalog.deleteMultiCatalog = (listId, res) => {
        catalogController.deleteMulti(Roomcatalog, listId)
            .then(result => {
                let response = new CommonResponse(true, 'delete success', result);
                res.json(response).end();
            })
            .catch(err => {
                let response = new CommonResponse(true, 'delete fail', err);
                res.status(400).json(response).end();
            })
    }

    Roomcatalog.remoteMethod('deleteMultiCatalog', {
        accepts: [
            { arg: 'listId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiCatalog', verb: 'delete' },
        description: 'delete room catalogs'
    })

    Roomcatalog.remoteMethod('deleteCatalog', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteCatalog', verb: 'delete' },
        description: 'delete room catalogs'
    })

    Roomcatalog.remoteMethod('updateRoomcatalog', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'catalogName', type: 'string' },
            { arg: 'catalogDescription', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateRoomCatalog', verb: 'put' },
        description: 'update room catalogs'
    })

    Roomcatalog.remoteMethod('getAllRoomCatalogs', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllRoomCatalogs', verb: 'get' },
        description: 'get all room catalogs'
    })

    Roomcatalog.remoteMethod('createRoomCatalog', {
        accepts: [{ arg: 'catalogName', type: 'String' },
        { arg: 'catalogDescription', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createRoomcatalog', verb: 'post' },
        description: 'create room catalog'
    })
};
