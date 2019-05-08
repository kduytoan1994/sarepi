'use strict';
var CommonResponse = require('../../server/common/common_response');
var Q = require('q')
const excelController = require('../../server/controllers/excelcontroller')
const forEach = require('async-foreach').forEach;
const nodeExcel = require('excel-export')
module.exports = function (Homes) {

    Homes.observe('before delete', (ctx, next) => {
        var id = ctx.where.id;
        console.log('id ' + id)
        Homes.findById(id)
            .then(home => {
                if (home) {
                    return Homes.app.models.Rooms.find({ where: { homeId: home.id } })
                }
            })
            .then(rooms => {
                var promises = [];
                rooms.forEach(room => {
                    promises.push(Homes.app.models.Reservations.destroyAll({ roomId: room.id }))
                })
                return Q.all(promises)
            }).then(result => {
                Homes.app.models.Rooms.destroyAll({ homeId: id })
                    .then(result => {
                        console.log(result)
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
        next();
    })
    Homes.changeStatus = (id, status, res) => {
        console.log(id)
        Homes.findOne({ where: { id: id } })
            .then(home => {
                console.log('home ', home)
                return home.updateAttributes({ homeStatus: status, update_at: new Date() })
            })
            .then(home => {
                console.log(home)
                res.json(new CommonResponse(true, "update room status success", home))
            })
            .catch(err => {
                res.json(err)
            })
    }

    Homes.updateHome = (id, homeName, homeDescription, homeTypeId, address, location, media, numFloor, numRoom, hotline, managerId, isActive, userId, outcome_service, income_service, extra_service, out_furnitures, res) => {
        var homeResult;
        Homes.findById(id)
            .then(home => {
                return home.updateAttributes({
                    homeName: homeName,
                    homeDescription: homeDescription,
                    homeTypeId: homeTypeId,
                    address: address,
                    location: location,
                    media: media,
                    numFloor: numFloor,
                    numRoom: numRoom,
                    hotline: hotline,
                    managerId: managerId,
                    isActive: isActive,
                    update_by: userId
                })
            })
            .then(homeUpdated => {
                homeResult = homeUpdated;
                let promise1 = Homes.app.models.home_outcomeService.destroyAll({ homeId: id });
                let promise2 = Homes.app.models.home_incomeService.destroyAll({ homeId: id });
                let promise3 = Homes.app.models.home_extraFee.destroyAll({ homeId: id });
                let promise4 = Homes.app.models.home_outFurniture.destroyAll({ homeId: id });

                return Promise.all([promise1, promise2, promise3, promise4])
            })
            .then(result => {
                console.log('result1', result)
                let promises = [];
                extra_service.forEach(extra_service_item => {
                    promises.push(Homes.app.models.home_extraFee.create({
                        homeId: id,
                        extraFeeId: extra_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                console.log('result2', result)
                let promises = [];
                outcome_service.forEach(outcome_service_item => {
                    promises.push(Homes.app.models.home_outcomeService.create({
                        homeId: id,
                        outcomeId: outcome_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                console.log('result3', result)
                let promises = [];
                income_service.forEach(income_service_item => {
                    promises.push(Homes.app.models.home_incomeService.create({
                        homeId: id,
                        incomeId: income_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                console.log('result4', result)
                let promises = [];
                out_furnitures.forEach(out_furniture_item => {
                    promises.push(Homes.app.models.home_incomeService.create({
                        homeId: id,
                        incomeId: out_furniture_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                console.log('result4', result)
                let response = new CommonResponse(true, 'update home success', homeResult);
                res.json(response);
            })
            .catch(err => {
                console.log(err)
                let response = new CommonResponse(false, 'update home fail', err);
                res.status(400).send(err);
            })
    }

    Homes.findHomeById = (id, res) => {
        Homes.findOne({
            where: { id: id }
            , include:
                [
                    {
                        relation: 'extraFees',
                        scope: {
                            fields: ['name', 'icon_link']
                        }
                    },
                    {
                        relation: 'outcomeUtilities',
                        scope: {
                            fields: ['name', 'icon_link']
                        }
                    },
                    {
                        relation: 'incomeUtilities',
                        scope: {
                            fields: ['name', 'icon_link']
                        }
                    }
                ]

        })
            .then(home => {
                console.log('home', home)
                res.json(new CommonResponse(true, "home", home))
            })
            .catch(err => {
                console.log(err)
                res.json(new CommonResponse(false, "err", err))
            })
    }

    Homes.addHome = (homeName, homeDescription, homeTypeId, address, location, media, numFloor, numRoom, hotline, managerId, isActive, outcome_service, income_service, extra_service, home_out_furniture, userId, res) => {
        var homeResult;
        Homes.create({
            homeName: homeName,
            homeDescription: homeDescription,
            homeTypeId: homeTypeId,
            address: address,
            location: location,
            media: media,
            homeStatus: 1,
            numFloor: numFloor,
            numRoom: 0,
            hotline: hotline,
            managerId: managerId,
            isActive: isActive,
            create_by: userId,
            update_by: userId
        })
            .then(newHome => {
                homeResult = newHome;
                let promises = [];
                extra_service.forEach(extra_service_item => {
                    promises.push(Homes.app.models.home_extraFee.create({
                        homeId: newHome.id,
                        extraFeeId: extra_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let promises = [];
                outcome_service.forEach(outcome_service_item => {
                    promises.push(Homes.app.models.home_outcomeService.create({
                        homeId: homeResult.id,
                        outcomeId: outcome_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let promises = [];
                income_service.forEach(income_service_item => {
                    promises.push(Homes.app.models.home_incomeService.create({
                        homeId: homeResult.id,
                        incomeId: income_service_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let promises = [];
                home_out_furniture.forEach(home_out_furniture_item => {
                    promises.push(Homes.app.models.home_outFurniture.create({
                        homeId: homeResult.id,
                        outFurnitureId: home_out_furniture_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let response = new CommonResponse(true, 'create new home success', homeResult);
                res.json(response);
            })
            .catch(err => {
                console.log(err)
                let response = new CommonResponse(false, 'create new home fail', err);
                // var error = new Error('create new home fail')
                // error.status = 400
                // console.log(error)
                res.status(422).json(response);
            })
    }

    Homes.homes = (skip, limit, homeName, homeTypeId, managerId, isActive, country_code, province_code, district_code, ward_code, searchText, res, req) => {
        let filter = {};
        if (homeName) {
            filter = Object.assign({}, filter, { homeName: homeName })
        }
        if (homeTypeId) {
            filter = Object.assign({}, filter, { homeTypeId: homeTypeId })
        }
        if (managerId) {
            filter = Object.assign({}, filter, { managerId: managerId })
        }
        if (isActive != null) {
            filter = Object.assign({}, filter, { isActive: { inq: isActive } })
        }
        if (searchText) {
            filter = Object.assign({}, filter, {
                or: [{ homeName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                { hotline: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                { 'address.address_text': { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }]
            })
        }
        if (ward_code && ward_code != "") {
            console.log('1')
            filter = Object.assign({}, filter, { "address.ward_code": ward_code })
        }
        else if (district_code && district_code != "") {
            console.log('2')
            filter = Object.assign({}, filter, { "address.district_code": district_code })
        } else if (province_code && province_code != "") {
            console.log('3')
            filter = Object.assign({}, filter, { "address.province_code": province_code })
        } else if (country_code && country_code != "") {
            console.log('4')
            filter = Object.assign({}, filter, { "address.country_code": country_code })
        }
        console.log('filter: ', filter)
        Homes.find({
            where: filter, order: 'update_at DESC', include: [{
                relation: "manager",
                scope: {
                    fields: ['userName', 'email', 'phoneNumber']
                }
            }, {
                relation: "create_by",
                scope: {
                    fields: ['userName', 'email', 'phoneNumber']
                }
            }, {
                relation: "update_by",
                scope: {
                    fields: ['userName', 'email', 'phoneNumber']
                }
            }, {
                relation: "homeCatalog",
                scope: {
                    fields: ['catalogName', 'catalogDescription']
                }
            }]
        },

        )
            .then(homes => {
                var temp = homes.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list home on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: homes.length })
                res.json(response).end();
            })
            .catch(err => {
                var response = new CommonResponse(false, "err ", err);
                res.json(response).end();
            })
    }

    Homes.searchHome = (searchText, checkin, checkout, roomTypeId, numGuest, minCost, maxCost, res) => {
        var filter = {};
        if (searchText) {
            filter = Object.assign({}, filter, { name: searchText })
        }
        if (checkin) {

        }
    }

    Homes.getHomeById = (id, res) => {
        var homeResult;
        Homes.findOne({
            where: { id: id }
            // , include:
            //     [{ relation: 'income_service' },
            //     { relation: 'outcome_service' },
            //     { relation: 'extra_service' }]

        })
            .then(home => {
                console.log('home', home)
                homeResult = home;
                console.log(home.location.country_code)
                var promiseProvince = Homes.app.models.Province.findOne({ where: { code: home.location.province_code } })
                var promiseDistrict = Homes.app.models.District.findOne({ where: { code: home.location.district_code } })
                console.log('home ', home)
                return Promise.all([promiseProvince, promiseDistrict])
            })
            .then(result => {
                console.log('result ', result)
                // home.location.proviceName = result[0].name;
                // home.location.districtName = result[1].name;
                var result1 = { home: homeResult, provinceName: result[0].name, districtName: result[1].name }
                console.log(result1)
                res.json(result1)
            })
            .catch(err => {
                res.json(err)
            })
    }

    Homes.getAllMedia = (id, res) => {
        Homes.findById(id)
            .then(home => {
                res.json(home.media);
            })
            .catch(err => {
                res.status(401).send(err)
            })
    }

    Homes.deleteHome = (id, res) => {
        Homes.app.models.Rooms.find({ where: { homeId: id } })
            .then(homes => {
                if (homes.length > 0) {
                    let response = new CommonResponse(false, 'delete new home fail', 'please delete all rooms of this home before');
                    res.status(400).json(response);
                } else {
                    Homes.destroyAll({ id: id })
                        .then(result => {
                            let response = new CommonResponse(true, 'delete new home success', result);
                            res.json(response);
                        })
                }
            })
            .catch(err => {
                console.log(err)
                let response = new CommonResponse(false, 'delete new home fail', err);
                res.status(400).json(response);
            })
    }

    Homes.csvexport = function (type, res, callback) {
        //@todo: get your data from database etc...
        var datetime = new Date();
        res.set('Expires', 'Tue, 03 Jul 2001 06:00:00 GMT');
        res.set('Cache-Control', 'max-age=0, no-cache, must-revalidate, proxy-revalidate');
        res.set('Last-Modified', datetime + 'GMT');
        res.set('Content-Type', 'application/force-download');
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Type', 'application/download');
        res.set('Content-Disposition', 'attachment;filename=Data.csv');
        res.set('Content-Transfer-Encoding', 'binary');
        res.send('ok;'); //@todo: insert your CSV data here.
    };

    Homes.importExcel = (req, res) => {

        excelController.uploadHome(req, res)
            .then(result => {
                let promises = [];
                let listHomes = result.data;
                forEach(listHomes, (homeItem, index) => {
                    console.log(homeItem)
                    promises.push(
                        Homes.create({
                            homeName: homeItem['tên toà'],
                            homeDescription: homeItem['mô tả'],
                            homeStatus: 1,
                            numFloor: homeItem['số tầng'],
                            numRoom: 0,
                            hotline: homeItem['hotline']
                        })
                    )
                })
                return Q.all(promises)
            })
            .then(result => {
                res.json(result)
            })
            .catch(err => {
                res.json(err)
            })
    }

    Homes.exportHomes = (req, res) => {
        // excelController.exportHomes(req, res)
        //     .then(result => {
        //         console.log(result)
        //         res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        //         res.setHeader("Content-Disposition", "attachment; filename=" + "Homes.xlsx");
        //         res.end(result, 'binary')
        //     })
        //     .catch(err => {
        //         res.json(err)
        //     })
        Homes.find()
            .then(homes => {
                var conf = {};
                conf.cols = [{
                    caption: 'string',
                    type: 'string'
                    , width: 15
                }, {
                    caption: 'Name',
                    type: 'string',

                }, {
                    caption: 'Description',
                    type: 'string',

                }, {
                    caption: 'Active',
                    type: 'bool'
                }, {
                    caption: 'Floor',
                    type: 'number',
                    width: 30
                }];
                conf.rows = []
                forEach(homes, (home, index) => {
                    conf.rows.push([home.id, home.homeName, home.homeDescription, home.isActive, home.numFloor])
                })
                var result = nodeExcel.execute(conf);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "Homes.xlsx");
                res.end(result, 'binary')
            })
    }

    Homes.remoteMethod('exportHomes',
        {
            accepts: [
                { arg: 'req', type: 'Object', http: { source: 'req' } },
                { arg: 'res', type: 'Object', http: { source: 'res' } }
            ],
            returns: [{ arg: 'res', type: 'file', root: true },
            { arg: 'Content-Type', type: 'application/vnd.openxmlformats', http: { target: 'header' } },
            { arg: 'Content-Disposition', type: "attachment; filename=" + "Homes.xlsx", http: { target: 'header' } }],
            http: { path: '/exportHomes', verb: 'get' }
        });

    Homes.remoteMethod('importExcel',
        {
            accepts: [
                { arg: 'req', type: 'Object', http: { source: 'req' } },
                { arg: 'res', type: 'object', http: { source: 'res' } }
            ],
            returns: { arg: 'res', type: 'Object', root: true },
            http: { path: '/importExcel', verb: 'post' }
        });

    Homes.remoteMethod('deleteHome', {
        accepts: [{ arg: 'id', type: 'String' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/deleteHome', verb: 'delete' },
        description: 'delete home by id'
    })

    Homes.remoteMethod('getAllMedia', {
        accepts: [{ arg: 'id', type: 'String' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/getAllMedia', verb: 'get' },
        description: 'get all media by id'
    })

    Homes.remoteMethod('findHomeById', {
        accepts: [{ arg: 'id', type: 'String' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/homeInfo', verb: 'get' },
        description: 'get home by id'
    })

    Homes.remoteMethod('addHome', {
        accepts: [
            { arg: 'homeName', type: 'string' },
            { arg: 'homeDescription', type: 'string' },
            { arg: 'homeTypeId', type: 'string' },
            { arg: 'address', type: 'Object' },
            { arg: 'location', type: 'GeoPoint' },
            { arg: 'media', type: 'Object' },
            { arg: 'numFloor', type: 'number' },
            { arg: 'numRoom', type: 'number' },
            { arg: 'hotline', type: 'string' },
            { arg: 'managerId', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'outcome_service', type: 'array' },
            { arg: 'income_service', type: 'array' },
            { arg: 'extra_service', type: 'array' },
            { arg: 'home_out_furniture', type: 'array' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/addNewHome', verb: 'post' },
        description: 'create home'
    })

    Homes.remoteMethod('updateHome', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'homeName', type: 'string' },
            { arg: 'homeDescription', type: 'string' },
            { arg: 'homeTypeId', type: 'string' },
            { arg: 'address', type: 'Object' },
            { arg: 'location', type: 'GeoPoint' },
            { arg: 'media', type: 'Object' },
            { arg: 'numFloor', type: 'number' },
            { arg: 'numRoom', type: 'number' },
            { arg: 'hotline', type: 'string' },
            { arg: 'managerId', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'userId', type: 'string' },
            { arg: 'outcome_service', type: 'array' },
            { arg: 'income_service', type: 'array' },
            { arg: 'extra_service', type: 'array' },
            { arg: 'home_out_furniture', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/updateHome', verb: 'put' },
        description: 'update home'
    })

    Homes.remoteMethod('homes', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'homeName', type: 'string' },
            { arg: 'homeTypeId', type: 'string' },
            { arg: 'managerId', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'country_code', type: 'String' },
            { arg: 'province_code', type: 'String' },
            { arg: 'district_code', type: 'String' },
            { arg: 'ward_code', type: 'String' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllHomes', verb: 'get' },
        description: 'get all homes'
    })

    Homes.remoteMethod('searchHome', {
        accepts: [
            { arg: 'country_code', type: 'String' },
            { arg: 'province_code', type: 'String' },
            { arg: 'district_code', type: 'String' },
            { arg: 'ward_code', type: 'String' },
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/searchHome', verb: 'get' },
        description: 'search home by location'
    })

    Homes.remoteMethod('changeStatus', {
        accepts: [{ arg: 'id', type: 'String' },
        { arg: 'status', type: 'number' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/changeStatus', verb: 'get' },
        description: 'active/deactive room'
    })
};