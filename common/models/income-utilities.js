'use strict';
const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController')
module.exports = function (Incomeutilities) {

    Incomeutilities.validatesUniquenessOf('name')

    Incomeutilities.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Incomeutilities.app.models.home_incomeService.destroyAll({ incomeId: id })
            .then(result => {
                console.log('delete Incomeutilities success')
            })
            .catch(err => {
                console.log('delete Incomeutilities fail', err)
            })
        next();
    })

    Incomeutilities.createIncomeUtilities = (name, description, icon_link, userId, isActive, res) => {
        utilities.createUtilities(Incomeutilities, name, description, icon_link, userId, isActive)
            .then(result => {
                let response = new CommonResponse(true, 'Incomeutilities ', result);
                res.json(response).end();
            })
            .catch(err => {
                if (err.err == true) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    let response = new CommonResponse(false, 'cannot create Incomeutilities', err);
                    res.status(400).json(response).end();
                }
            })
    }

    Incomeutilities.getAllIncome = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Incomeutilities, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Incomeutilities.search = (skip, limit, key, res, req) => {
        var filter = { name: { "regexp": key + `*` } }
        console.log('filter', filter)
        Incomeutilities.find({ where: filter })
            .then(incomeutilities => {
                var temp = incomeutilities.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list incomeutilities on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: incomeutilities.length })
                res.json(response).end();
            })
    }

    Incomeutilities.updateIncomeutilities = (id, name, description, isActive, userId, res) => {
        utilities.updateAttributes(Incomeutilities, id, name, description, isActive, userId)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(422).json(response).end();
            })

    }

    Incomeutilities.deleteMulti = (listIncomeutilitiesId, res) => {
        utilities.deleteMulti(Incomeutilities, listIncomeutilitiesId)
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

    Incomeutilities.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listIncomeutilitiesId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiIncomeutilities', verb: 'delete' },
        description: 'delete multi Incomeutilities'
    })

    Incomeutilities.remoteMethod('updateIncomeutilities', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateIncomeutilities', verb: 'put' },
        description: 'update Incomeutilities'
    })

    Incomeutilities.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'search all incomeutilities'
    })

    Incomeutilities.remoteMethod('getAllIncome', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllIncomeUtilities', verb: 'get' },
        description: 'get all incomeutilities'
    })

    Incomeutilities.remoteMethod('createIncomeUtilities', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'String' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/incomeUtilities', verb: 'post' },
        description: 'create incomeUtilities'
    })

};

