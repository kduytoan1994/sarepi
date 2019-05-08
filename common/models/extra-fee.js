'use strict';
const CommonResponse = require('../../server/common/common_response');
const utilities = require('../../server/controllers/utilitiesController');
module.exports = function (Extrafee) {

    Extrafee.validatesUniquenessOf('name')

    Extrafee.observe('before delete', (ctx, next) => {
        console.log("xxxx", ctx.where.id);
        let id = ctx.where.id;
        Extrafee.app.models.home_extraFee.destroyAll({ extraFeeId: id })
            .then(result => {
                console.log('delete extraFee in home success')
            })
            .catch(err => {
                console.log('delete extra fee in home fail', err)
            })
        next();
    })

    Extrafee.createExtrafee = (name, description, icon_link, userId, isActive, unit, res) => {
        console.log('userId', userId);
        Extrafee.find({ where: { name: name } })
            .then(extraFees => {
                console.log(extraFees)
                if (extraFees.length > 0) {
                    res.status(400).json(new CommonResponse(false, 'name is existed!', 'name is existed!'))
                } else {
                    Extrafee.create({
                        name: name,
                        description: description,
                        icon_link: icon_link,
                        isActive: isActive,
                        unit: unit,
                        create_by: userId,
                        create_at: new Date(),
                        update_by: userId,
                        update_at: new Date()
                    })
                        .then(extrafee => {
                            let response = new CommonResponse(true, 'extrafee ', extrafee);
                            res.json(response).end();
                        })
                        .catch(err => {
                            let response = new CommonResponse(false, 'cannot create extrafee', err);
                            res.status(400).json(response).end();
                        })
                }
            })
    }

    Extrafee.getAllExtrafee = (skip, limit, name, isActive, searchText, res, req) => {
        utilities.getAllUtilities(Extrafee, skip, limit, name, isActive, searchText)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err', err);
                res.status(400).json(response).end();
            })
    }

    Extrafee.search = (skip, limit, key, res) => {
        var filter = { name: { "regexp": key + `*` } }
        console.log('filter', filter)
        Extrafee.find({ where: filter })
            .then(extrafees => {
                var temp = extrafees.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list extrafees on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: extrafees.length })
                res.json(response).end();
            })
    }

    Extrafee.updateExtrafee = (id, name, description, isActive, userId, unit, res) => {
        Extrafee.findById(id)
            .then(extraFeeItem => {
                extraFeeItem.updateAttributes({ name: name, description: description, isActive: isActive, unit: unit, update_by: userId })
                    .then(extraFeeItemUpdated => {
                        let response = new CommonResponse(true, 'extraFeeItemUpdated ', extraFeeItemUpdated);
                        res.json(response)
                    })
                    .catch(err => {
                        console.log(err)
                        let response = new CommonResponse(false, 'extraFeeItemUpdated ', err);
                        res.status(400).json(response)
                    })
            })
    }

    Extrafee.deleteMulti = (listExtrafeeId, res) => {
        utilities.deleteMulti(Extrafee, listExtrafeeId)
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

    Extrafee.remoteMethod('deleteMulti', {
        accepts: [
            { arg: 'listExtrafeeId', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/deleteMultiExtraFee', verb: 'delete' },
        description: 'delete multi extra fee'
    })

    Extrafee.remoteMethod('updateExtrafee', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'name', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'unit', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateExtrafee', verb: 'put' },
        description: 'update extraFee'
    })

    Extrafee.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'get search Extrafee by name'
    })

    Extrafee.remoteMethod('getAllExtrafee', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllExtrafees', verb: 'get' },
        description: 'get all Extrafee'
    })

    Extrafee.remoteMethod('createExtrafee', {
        accepts: [{ arg: 'name', type: 'String' },
        { arg: 'description', type: 'String' },
        { arg: 'icon_link', type: 'String' },
        { arg: 'userId', type: 'String' },
        { arg: 'isActive', type: 'boolean' },
        { arg: 'unit', type: 'string' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/createExtrafee', verb: 'post' },
        description: 'create extrafee'
    })

};
