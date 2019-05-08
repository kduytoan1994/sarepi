'use strict';
const CommonResponse = require('../../server/common/common_response');
const constants = require('../../server/constants');
var Q = require('q')
module.exports = function (Rooms) {

    Rooms.lockroom = (data, res, next) => {
        if (!data.roomId) {
            let response = new CommonResponse(false, 'Missing roomId params', {});
            res.json(response).end();
        } else {
            Rooms.findById(data.roomId)
                .then(room => {
                    room.updateAttributes({ roomStatus: constants.ROOM_STATUS.CLOSED, update_at: new Date() }, (err, count) => {
                        console.log(count)
                        if (err) {
                            return next(err)
                        } else {
                            let response = new CommonResponse(true, 'lock room success', {});
                            res.json(response).end();
                        }
                    })
                })
                .catch(err => {
                    res.json(err)
                })

        }
    }

    Rooms.unlockroom = (data, res, next) => {
        if (!data.roomId) {
            let response = new CommonResponse(false, 'Missing roomId params', {});
            res.json(response).end();
        } else {
            Rooms.updateAll({ id: data.roomId }, { roomStatus: constants.ROOM_STATUS.EMPTY, update_at: new Date() }, (err, count) => {
                if (err) {
                    return next(err)
                } else {
                    let response = new CommonResponse(true, 'unlock room success', {});
                    res.json(response).end();
                }
            })
        }
    }

    Rooms.addRoom = (roomName, roomArea, roomDescription, homeId, maxGuest, roomTypeId, roomMedia, isActive, roomDatePrice, roomMonthPrice, userId, inFurnitures, room_utilities, extraFees, res) => {
        var roomResult;
        Rooms.create({
            roomName: roomName,
            roomArea: roomArea,
            roomDescription: roomDescription,
            homeId: homeId,
            maxGuest: maxGuest,
            roomTypeId: roomTypeId,
            roomMedia: roomMedia,
            isActive: isActive,
            roomDatePrice: roomDatePrice,
            roomMonthPrice: roomMonthPrice,
            roomStatus: 1,
            listReservation: [],
            create_by: userId,
            update_by: userId,
            update_at: new Date(),
            create_at: new Date()
        })
            .then(newRoom => {//add furniture for room
                roomResult = newRoom;
                let promises = [];
                inFurnitures.forEach(inFurnitures_item => {
                    promises.push(Rooms.app.models.room_inFurniture.create({
                        roomId: newRoom.id,
                        inFurnitureId: inFurnitures_item.id,
                        cost: inFurnitures_item.cost
                    }))
                })
                return Q.all(promises);
            })
            .then(result => { //add utilities for room
                let promises = [];
                room_utilities.forEach(room_utilities_item => {
                    promises.push(Rooms.app.models.room_roomUtilities.create({
                        roomId: roomResult.id,
                        roomUtilityId: room_utilities_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => { //add utilities for room
                let promises = [];
                extraFees.forEach(extraFees_item => {
                    promises.push(Rooms.app.models.room_extraFee.create({
                        roomId: roomResult.id,
                        extraFeeId: extraFees_item.id,
                        priceOneUnit: extraFees_item.priceOneUnit
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                return Rooms.app.models.Homes.findById(homeId)
            })
            .then(home => { //update number room
                home.updateAttributes({ numRoom: (home.numRoom + 1) })
            })
            .then(homeUpdated => {
                let response = new CommonResponse(true, 'create new room success', roomResult);
                res.json(response);
            })
            .catch(err => {
                res.status(400).send(err)
            })
    }

    Rooms.updateRoom = (id, roomName, roomArea, roomDescription, homeId, maxGuest, roomTypeId, roomMedia, isActive, roomDatePrice, roomMonthPrice, userId, inFurnitures, room_utilities, extraFees, res) => {
        var roomResult;
        Rooms.findById(id)
            .then(room => {
                room.updateAttributes({
                    roomName: roomName,
                    roomArea: roomArea,
                    roomDescription: roomDescription,
                    homeId: homeId,
                    maxGuest: maxGuest,
                    roomTypeId: roomTypeId,
                    roomMedia: roomMedia,
                    isActive: isActive,
                    roomDatePrice: roomDatePrice,
                    roomMonthPrice: roomMonthPrice,
                    update_by: userId
                })
            })
            .then(roomUpdated => {
                roomResult = roomUpdated;
                let promise1 = Rooms.app.models.room_inFurniture.destroyAll({ roomId: id });
                let promise2 = Rooms.app.models.room_roomUtilities.destroyAll({ roomId: id })
                let promise3 = Rooms.app.models.room_extraFee.destroyAll({ roomId: id })

                return Promise.all([promise1, promise2,promise3])
            })
            .then(result => {
                let promises = [];
                inFurnitures.forEach(inFurnitures_item => {
                    promises.push(Rooms.app.models.room_inFurniture.create({
                        roomId: id,
                        inFurnitureId: inFurnitures_item.id,
                        cost: inFurnitures_item.cost
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let promises = [];
                room_utilities.forEach(room_utilities_item => {
                    promises.push(Rooms.app.models.room_roomUtilities.create({
                        roomId: id,
                        roomUtilityId: room_utilities_item
                    }))
                })
                return Q.all(promises);
            })
            .then(result => { //add extraFee for room
                let promises = [];
                extraFees.forEach(extraFees_item => {
                    promises.push(Rooms.app.models.room_extraFee.create({
                        roomId: roomResult.id,
                        extraFeeId: extraFees_item.id,
                        priceOneUnit: extraFees_item.priceOneUnit
                    }))
                })
                return Q.all(promises);
            })
            .then(result => {
                let response = new CommonResponse(true, 'update room success', '');
                res.json(response);
            })
            .catch(err => {
                console.log(err)
                res.status(400).send(err)
            })
    }

    Rooms.unconstructingroom = (data, res, next) => {
        if (!data.roomId) {
            let response = new CommonResponse(false, 'Missing roomId params', {});
            res.json(response).end();
        } else {
            Rooms.updateAll({ id: data.roomId }, { roomStatus: constants.ROOM_STATUS.EMPTY, update_at: new Date() }, (err, count) => {
                if (err) {
                    return next(err)
                } else {
                    let response = new CommonResponse(true, 'unconstructing room success', {});
                    res.json(response).end();
                }
            })
        }
    }

    Rooms.deleteRoom = (roomId, res) => {
        Rooms.findById(roomId)
            .then(room => {
                return Rooms.app.models.Homes.findOne({ where: { id: room.homeId } })
            })
            .then(home => {
                home.numRoom = home.numRoom - 1;
                home.save()
                return Rooms.destroyAll({ id: roomId })
                    .then(result => {
                        console.log('result', result)
                        let response = new CommonResponse(true, 'delete room success', result);
                        res.json(response);
                    })
                    .catch(err => {
                        let response = new CommonResponse(true, 'delete room fail', err);
                        res.status(400).json(response);
                    })
            })
    }

    Rooms.getRoomByStatus = (status, skip, limit, homeId, res) => {
        var promise;
        if (status == 0) {
            console.log('get all')
            promise = Rooms.find({ where: { homeId: homeId } })
        } else {
            promise = Rooms.find({ where: { homeId: homeId, roomStatus: status } })
        }
        promise.then(rooms => {
            var temp = rooms.slice(skip, skip + limit);
            let response = new CommonResponse(true, 'list room ', temp);
            response = Object.assign({}, response, { count: rooms.length })
            res.json(response).end();
        })
            .catch(err => {
                res.json(err)
            })
    }

    Rooms.getRoomDetail = (roomId, res) => {
        Rooms.findOne({
            where: { id: roomId },
            include: [{
                relation: 'roomCatalog',
                scope: {
                    fields: ['catalogName', 'catalogDescription']
                }
            }, {
                relation: 'homes',
                scope: {
                    fields: ['homeName', 'homeDescription']
                }
            }, {
                relation: 'inFurnitures',
                scope: {
                    fields: ['name', 'icon_link'],
                    include: {
                        relation: 'roomInfurnitures',
                        scope: {
                            where: { 'roomId': roomId },
                            fields: ['cost']
                        }
                    }
                }
            }, {
                relation: 'room_utilities',
                scope: {
                    fields: ['name', 'icon_link'],

                }
            }]
        })
            .then(room => {
                var currentReservation = room.currentReservation;
                if (currentReservation) {
                    console.log(currentReservation)
                    Rooms.app.models.Reservations.findOne({
                        where: { id: currentReservation },
                        include: {
                            relation: 'customer'
                        }
                    })
                        .then(reservation => {
                            console.log(reservation)
                            var result = { room: room, reservation: reservation }
                            let response = new CommonResponse(true, 'room detail ', result);
                            res.json(response).end();
                        })
                } else {
                    var result = { room: room, reservation: {} }
                    let response = new CommonResponse(true, 'room detail ', result);
                    res.json(response).end();
                }
            })
            .catch(err => {
                res.json(err)
            })
    }

    Rooms.countRoomByStatus = (homeId, res) => {
        var count = Rooms.find({ where: { homeId: homeId } });
        var count1 = Rooms.find({ where: { homeId: homeId, roomStatus: constants.ROOM_STATUS.EMPTY } });
        var count2 = Rooms.find({ where: { homeId: homeId, roomStatus: constants.ROOM_STATUS.BOOKING } });
        var count3 = Rooms.find({ where: { homeId: homeId, roomStatus: constants.ROOM_STATUS.STAYING } });
        var count4 = Rooms.find({ where: { homeId: homeId, roomStatus: constants.ROOM_STATUS.CLOSED } });
        Promise.all([count, count1, count2, count3, count4])
            .then(listnumroom => {
                var result = listnumroom.map(x => x.length);
                console.log('result', result)
                let response = new CommonResponse(true, 'count rooms by status ', result);
                res.json(response).end();
            })
            .catch(err => {
                res.json(err)
            })
    }

    Rooms.searchRoomByHomeName = (homeName, res) => {
        Rooms.app.models.Homes.findOne({ where: { homeName: homeName } })
            .then(home => {
                if (home) {
                    Rooms.find({ where: { homeId: home.id } })
                        .then(rooms => {
                            let response = new CommonResponse(true, 'list room ', rooms);
                            res.json(response).end();
                        })
                } else {
                    res.json('Cannot find' + homeName).end();
                }
            })
            .catch(err => {
                let response = new CommonResponse(false, 'err ', err);
                res.json(response).end();
            })

    }

    Rooms.rooms = (skip, limit, homeId, isActive, searchText, res) => {
        var filter = {}
        if (homeId) {
            filter = Object.assign({}, filter, { homeId: homeId })
        }
        if (isActive != null) {
            filter = Object.assign({}, filter, { isActive: { inq: isActive } })
        }
        if (searchText) {
            filter = Object.assign({}, filter, {
                or: [
                    { roomName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                    { roomDescription: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }
                ]
            })
        }
        Rooms.find({
            where: filter, order: 'update_at DESC',
            include: [{
                relation: 'roomCatalog',
                scope: {
                    fields: ['catalogName', 'catalogDescription']
                }
            }, {
                relation: 'homes',
                scope: {
                    fields: ['homeName', 'homeDescription']
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
            },
            {
                relation: 'inFurnitures',
                scope: {
                    fields: ['name', 'icon_link']
                    // include: {
                    //     relation: 'roomInfurnitures',
                    //     scope: {
                    //         fields: ['cost']
                    //     }
                    // }
                }
            }, {
                relation: 'room_utilities',
                scope: {
                    fields: ['name', 'icon_link'],

                }
            }]
        })
            .then(rooms => {
                var temp = rooms.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list room on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: rooms.length })
                res.json(response);
            })
            .catch(err => {
                res.json(err)
            })
    }

    Rooms.remoteMethod('rooms', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'homeId', type: 'string' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllRooms', verb: 'get' },
        description: 'get all rooms'
    })

    Rooms.remoteMethod('updateRoom', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'roomName', type: 'string' },
            { arg: 'roomArea', type: 'number' },
            { arg: 'roomDescription', type: 'string' },
            { arg: 'homeId', type: 'string' },
            { arg: 'maxGuest', type: 'number' },
            { arg: 'roomTypeId', type: 'string' },
            { arg: 'roomMedia', type: 'object' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'roomDatePrice', type: 'number' },
            { arg: 'roomMonthPrice', type: 'number' },
            { arg: 'userId', type: 'string' },
            { arg: 'inFurnitures', type: 'array' },
            { arg: 'room_utilities', type: 'array' },
            { arg: 'extraFees', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/updateRoom', verb: 'put' },
        description: 'update room'
    })

    Rooms.remoteMethod('addRoom', {
        accepts: [
            { arg: 'roomName', type: 'string' },
            { arg: 'roomArea', type: 'number' },
            { arg: 'roomDescription', type: 'string' },
            { arg: 'homeId', type: 'string' },
            { arg: 'maxGuest', type: 'number' },
            { arg: 'roomTypeId', type: 'string' },
            { arg: 'roomMedia', type: 'object' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'roomDatePrice', type: 'number' },
            { arg: 'roomMonthPrice', type: 'number' },
            { arg: 'userId', type: 'string' },
            { arg: 'inFurnitures', type: 'array' },
            { arg: 'room_utilities', type: 'array' },
            { arg: 'extraFees', type: 'array' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/addNewRoom', verb: 'post' },
        description: 'create room'
    })
    Rooms.remoteMethod('searchRoomByHomeName', {
        accepts: [
            { arg: 'homeName', type: 'String' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }
        ],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/searchRoom', verb: 'get' },
        description: 'search rooms by home name'
    })

    Rooms.remoteMethod('lockroom', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/lockroom', verb: 'post' },
        description: 'lock room'
    })

    Rooms.remoteMethod('unlockroom', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/unlockroom', verb: 'post' },
        description: 'unlock room'
    })

    Rooms.remoteMethod('constructingroom', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/constructingroom', verb: 'post' },
        description: 'Constructing room'
    })

    Rooms.remoteMethod('unconstructingroom', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/unconstructingroom', verb: 'post' },
        description: 'unconstructing room'
    })
    Rooms.remoteMethod('getRoomByStatus', {
        accepts: [{ arg: 'status', type: 'number' },
        { arg: 'skip', type: 'number' },
        { arg: 'limit', type: 'number' },
        { arg: 'homeId', type: 'String' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/getRoomByStatus', verb: 'get' },
        description: 'get room by status'
    })

    Rooms.remoteMethod('deleteRoom', {
        accepts: [
            { arg: 'roomId', type: 'String' },
            {
                arg: 'res', type: 'Object', http: { source: 'res' }
            }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/deleteRoom', verb: 'delete' },
        description: 'delete room'
    })

    Rooms.remoteMethod('countRoomByStatus', {
        accepts: [
            { arg: 'homeId', type: 'String' },
            {
                arg: 'res', type: 'Object', http: { source: 'res' }
            }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/countRoomByStatus', verb: 'get' },
        description: 'count room by status'
    })

    Rooms.remoteMethod('getRoomDetail', {
        accepts: [
            { arg: 'roomId', type: 'String' },
            {
                arg: 'res', type: 'Object', http: { source: 'res' }
            }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/roomDetail', verb: 'get' },
        description: 'get room detail'
    })
};