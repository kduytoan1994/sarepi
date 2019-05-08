'use strict';
const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController')
module.exports = function (Infurniture) {

    Infurniture.validatesUniquenessOf('name')

    Infurniture.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Infurniture.app.models.room_inFurniture.destroyAll({ inFurnitureId: id })
            .then(result => {
                console.log('delete Infurniture success')
            })
            .catch(err => {
                console.log('delete Infurniture fail', err)
            })
        next();
    })

    Infurniture.createInfurniture = (name, description, icon_link, userId, isActive, res) => {
        utilities.createUtilities(Infurniture, name, description, icon_link, userId, isActive)
            .then(result => {
                let response = new CommonResponse(true, 'Infurniture ', result);
                res.json(response).end();
            })
            .catch(err => {
                if (err.err == true) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    let response = new CommonResponse(false, 'cannot create Infurniture', err);
                    res.status(400).json(response).end();
                }
            })
    }

    Infurniture.getAllInfurniture = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Infurniture, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Infurniture.search = (skip, limit, key, res) => {
        var filter = { name: { "regexp": key + `*` } }
        console.log('filter', filter)
        Infurniture.find({ where: filter })
            .then(infurnitures => {
                var temp = infurnitures.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list infurnitures on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: infurnitures.length })
                res.json(response).end();
            })
    }

    Infurniture.updateInfurniture = (id, name, description, isActive, userId, res) => {
        utilities.updateAttributes(Infurniture, id, name, description, isActive, userId)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(422).json(response).end();
            })

    }

    Infurniture.deleteMulti = (listInfurnitureId, res) => {
        utilities.deleteMulti(Infurniture, listInfurnitureId)
            .then(result => {
                let response = new CommonResponse(true, 'delete success', result);
                res.json(response).end();
            })
            .catch(err => {
                console.log(err)
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Infurniture.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listInfurnitureId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiInfurniture', verb: 'delete' },
        description: 'delete multi Infurniture'
    })

    Infurniture.remoteMethod('updateInfurniture', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateInfurniture', verb: 'put' },
        description: 'update inFurniture'
    })


    Infurniture.remoteMethod('test', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'roomId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/test', verb: 'get' },
        description: 'test Infurniture'
    })

    Infurniture.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'get search Infurniture by name'
    })

    Infurniture.remoteMethod('getAllInfurniture', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllInfurnitures', verb: 'get' },
        description: 'get all Infurniture'
    })

    Infurniture.remoteMethod('createInfurniture', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'description' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createInfurniture', verb: 'post' },
        description: 'create infurniture'
    })
};
