'use strict';
const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController')
module.exports = function (Outfurniture) {

    Outfurniture.validatesUniquenessOf('name')

    Outfurniture.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Outfurniture.app.models.home_outFurniture.destroyAll({ outFurnitureId: id })
            .then(result => {
                console.log('delete Outfurniture success')
            })
            .catch(err => {
                console.log('delete Outfurniture fail', err)
            })
        next();
    })

    Outfurniture.createOutfurniture = (name, description, icon_link, userId, isActive, res) => {
        utilities.createUtilities(Outfurniture, name, description, icon_link, userId, isActive)
            .then(result => {
                let response = new CommonResponse(true, 'Outfurniture ', result);
                res.json(response).end();
            })
            .catch(err => {
                if (err.err == true) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    let response = new CommonResponse(false, 'cannot create Outfurniture', err);
                    res.status(400).json(response).end();
                }
            })
    }

    Outfurniture.getAllOutfurniture = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Outfurniture, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Outfurniture.search = (skip, limit, key, res) => {
        var filter = { name: { "regexp": key + `*` } }
        console.log('filter', filter)
        Outfurniture.find({ where: filter })
            .then(outfurnitures => {
                var temp = outfurnitures.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list outfurnitures on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: outfurnitures.length })
                res.json(response).end();
            })
    }

    Outfurniture.updateOutfurniture = (id, name, description, isActive, userId, res) => {
        utilities.updateAttributes(Outfurniture, id, name, description, isActive, userId)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(422).json(response).end();
            })

    }

    Outfurniture.deleteMulti = (listOutfurnitureId, res) => {
        utilities.deleteMulti(Outfurniture, listOutfurnitureId)
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

    Outfurniture.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listOutfurnitureId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiOutfurnitures', verb: 'delete' },
        description: 'delete multi Outfurniture'
    })

    Outfurniture.remoteMethod('updateOutfurniture', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateOutfurniture', verb: 'put' },
        description: 'update Out furniture'
    })

    Outfurniture.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'get search Outfurniture by name'
    })

    Outfurniture.remoteMethod('getAllOutfurniture', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllOutfurnitures', verb: 'get' },
        description: 'get all Outfurniture'
    })

    Outfurniture.remoteMethod('createOutfurniture', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'String' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createOutfurniture', verb: 'post' },
        description: 'create outfurniture'
    })
};
