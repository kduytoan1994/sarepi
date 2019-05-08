'use strict';

const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController')
module.exports = function (Outcomeutilities) {

    Outcomeutilities.validatesUniquenessOf('name')

    Outcomeutilities.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Outcomeutilities.app.models.home_outcomeService.destroyAll({ outcomeId: id })
            .then(result => {
                console.log('delete Outcomeutilities success')
            })
            .catch(err => {
                console.log('delete Outcomeutilities fail', err)
            })
        next();
    })


    Outcomeutilities.createOutcomeUtilities = (name, description, icon_link, userId, isActive, res) => {
        utilities.createUtilities(Outcomeutilities, name, description, icon_link, userId, isActive)
            .then(result => {
                let response = new CommonResponse(true, 'Outcomeutilities ', result);
                res.json(response).end();
            })
            .catch(err => {
                if (err.err == true) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    let response = new CommonResponse(false, 'cannot create Outcomeutilities', err);
                    res.status(400).json(response).end();
                }
            })
    }

    Outcomeutilities.getAllOutcome = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Outcomeutilities, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Outcomeutilities.search = (skip, limit, name, res, req) => {
        var filter = { name: { "regexp": key + `*` } }
        Outcomeutilities.find({ where: filter })
            .then(outcomeutilities => {
                var temp = outcomeutilities.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list Outcomeutilities on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: outcomeutilities.length })
                res.json(response).end();
            })
    }

    Outcomeutilities.updateOutcomeutilities = (id, name, description, isActive, userId, res) => {
        utilities.updateAttributes(Outcomeutilities, id, name, description, isActive, userId)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(422).json(response).end();
            })
    }

    Outcomeutilities.deleteMulti = (listOutcomeutilitiesId, res) => {
        utilities.deleteMulti(Outcomeutilities, listOutcomeutilitiesId)
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

    Outcomeutilities.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listOutcomeutilitiesId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiOutcomeutilities', verb: 'delete' },
        description: 'delete multi Outcomeutilities'
    })

    Outcomeutilities.remoteMethod('updateOutcomeutilities', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateOutcomeutilities', verb: 'put' },
        description: 'update Outcomeutilities'
    })

    Outcomeutilities.remoteMethod('getAllOutcome', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllOutcomeUtilities', verb: 'get' },
        description: 'get all Outcomeutilities'
    })

    Outcomeutilities.remoteMethod('createOutcomeUtilities', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'String' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/outcomeUtilities', verb: 'post' },
        description: 'create outcomeUtilities'
    })
};
