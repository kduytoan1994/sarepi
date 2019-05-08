'use strict';
const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController')
module.exports = function (Roomutilities) {

    Roomutilities.validatesUniquenessOf('name')
    
    Roomutilities.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Roomutilities.app.models.room_roomUtilities.destroyAll({ roomUtilityId: id })
            .then(result => {
                console.log('delete Roomutilities success')
            })
            .catch(err => {
                console.log('delete Roomutilities fail', err)
            })
        next();
    })

    Roomutilities.createRoomutilities = (name, description, icon_link, userId, isActive, res) => {
        utilities.createUtilities(Roomutilities, name, description, icon_link, userId, isActive)
            .then(result => {
                let response = new CommonResponse(true, 'Roomutilities ', result);
                res.json(response).end();
            })
            .catch(err => {
                if (err.err == true) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    let response = new CommonResponse(false, 'cannot create Roomutilities', err);
                    res.status(400).json(response).end();
                }
            })
    }

    Roomutilities.getAllRoomutilities = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Roomutilities, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Roomutilities.search = (skip, limit, key, res) => {
        var filter = { name: { "regexp": key + `*` } }
        console.log('filter', filter)
        Roomutilities.find({ where: filter })
            .then(roomutilities => {
                var temp = roomutilities.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list roomutilities on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: roomutilities.length })
                res.json(response).end();
            })
    }

    Roomutilities.updateRoomutilities = (id, name, description, isActive, userId, res) => {
        utilities.updateAttributes(Roomutilities, id, name, description, isActive, userId)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(422).json(response).end();
            })

    }

    Roomutilities.deleteMulti = (listRoomutilitiesId, res) => {
        utilities.deleteMulti(Roomutilities, listRoomutilitiesId)
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

    Roomutilities.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listRoomutilitiesId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiRoomutilities', verb: 'delete' },
        description: 'delete multi Roomutilities'
    })


    Roomutilities.remoteMethod('updateRoomutilities', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateRoomutilities', verb: 'put' },
        description: 'update Roomutilities'
    })

    Roomutilities.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'get search Roomutilities by name'
    })

    Roomutilities.remoteMethod('getAllRoomutilities', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllRoomutilitiess', verb: 'get' },
        description: 'get all Roomutilities'
    })

    Roomutilities.remoteMethod('createRoomutilities', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'String' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createRoomutilities', verb: 'post' },
        description: 'create roomutility'
    })
};
