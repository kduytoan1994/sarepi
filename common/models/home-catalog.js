'use strict';
const CommonResponse = require('../../server/common/common_response');
const catalogController = require('../../server/controllers/catalogController')

module.exports = function (Homecatalog) {

    Homecatalog.validatesUniquenessOf('catalogName')

    Homecatalog.createHomeCatalog = (catalogName, catalogDescription, userId, isActive, res) => {
        Homecatalog.find({ where: { catalogName: catalogName } })
            .then(homeCatalogs => {
                console.log('homeCatalogs', homeCatalogs)
                if (homeCatalogs.length > 0) {
                    res.status(400).json(new CommonResponse(false, 'catalog name is existed!', 'catalog name is existed!'))
                } else {
                    Homecatalog.create({
                        catalogName: catalogName,
                        catalogDescription: catalogDescription,
                        create_by: userId,
                        isActive: isActive,
                        create_at: new Date(),
                        update_by: userId,
                        update_at: new Date()
                    })
                        .then(homeCatalog => {
                            let response = new CommonResponse(true, 'homeCatalog ', homeCatalog);
                            res.json(response).end();
                        })
                        .catch(err => {
                            let response = new CommonResponse(false, 'cannot create home catalog', err);
                            res.status(400).json(response).end();
                        })
                }
            })
    }

    Homecatalog.updateHomeCatalog = (id, catalogName, catalogDescription, isActive, userId, res) => {
        Homecatalog.findById(id)
            .then(homeCatalog => {
                homeCatalog.updateAttributes({ catalogName: catalogName, catalogDescription: catalogDescription, isActive: isActive, update_by: userId })
                    .then(homeCatalogResult => {
                        let response = new CommonResponse(true, 'homeCatalog ', homeCatalogResult);
                        res.json(response).end();
                    })
                    .catch(err => {
                        console.log(err)
                        let response = new CommonResponse(false, 'cannot update home catalog', err);
                        res.status(422).json(response).end();
                    })
            })

    }

    Homecatalog.getAllHomeCatalogs = (skip, limit, name, isActive, searchText, res, req) => {

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
        Homecatalog.find({
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
            .then(homeCatalogs => {
                var temp = homeCatalogs.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list homeCatalogs on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: homeCatalogs.length })
                res.json(response).end();
            })

    }

    Homecatalog.search = (skip, limit, key, res, req) => {

        var filter = { catalogName: { "regexp": key + `*` } }
        console.log('filter', filter)
        Homecatalog.find({ where: filter })
            .then(homeCatalogs => {
                var temp = homeCatalogs.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list homeCatalogs on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: homeCatalogs.length })
                res.json(response).end();
            })
    }

    Homecatalog.deleteCatalog = (id, res) => {
        Homecatalog.app.models.Homes.find({ where: { homeTypeId: id } })
            .then(homeCatalogs => {
                if (homeCatalogs.length > 0) {
                    let response = new CommonResponse(false, 'please delete all home in this home catalog ', '');
                    res.json(response).end();
                } else {
                    Homecatalog.destroyAll({ id: id })
                        .then(result => {
                            let response = new CommonResponse(true, 'delete success', result);
                            res.json(response).end();
                        })
                }
            })
    }

    Homecatalog.deleteMultiCatalog = (listId, res) => {
        catalogController.deleteMulti(Homecatalog, listId)
            .then(result => {
                console.log(result)
                let response = new CommonResponse(true, 'delete success', result);
                res.json(response).end();
            })
            .catch(err => {
                console.log(err)
                let response = new CommonResponse(true, 'delete fail', err);
                res.status(400).json(response).end();
            })
    }

    Homecatalog.remoteMethod('deleteMultiCatalog', {
        accepts: [
            { arg: 'listId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiCatalog', verb: 'delete' },
        description: 'delete multi home catalogs'
    })

    Homecatalog.remoteMethod('deleteCatalog', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteCatalog', verb: 'delete' },
        description: 'delete home catalogs'
    })

    Homecatalog.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'search all home catalogs'
    })

    Homecatalog.remoteMethod('getAllHomeCatalogs', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllHomeCatalogs', verb: 'get' },
        description: 'get all home catalogs'
    })

    Homecatalog.remoteMethod('updateHomeCatalog', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'catalogName', type: 'string' },
            { arg: 'catalogDescription', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateHomeCatalog', verb: 'put' },
        description: 'update home catalogs'
    })

    Homecatalog.remoteMethod('createHomeCatalog', {
        accepts: [{ arg: 'catalogName', type: 'string' },
        { arg: 'catalogDescription', type: 'string' },
        { arg: 'userId', type: 'string' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createHomeCatalog', verb: 'post' },
        description: 'create home catalog'
    })
};
