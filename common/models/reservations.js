'use strict';

const CommonResponse = require('../../server/common/common_response');
const server = require('../../server/server')
const constants = require('../../server/constants');
const randomString = require('randomstring');
const swig = require('swig')
const path = require('path');
const Q = require('q');
const homeController = require('../../server/controllers/homeController')
const roomController = require('../../server/controllers/roomController')
const reservationController = require('../../server/controllers/reservationController')
const forEach = require('async-foreach').forEach;

module.exports = function (Reservations) {

    Reservations.checkin = (data, res, next) => {
        if (!data.reservationId) {
            let response = new CommonResponse(false, 'Missing reservationId params', {});
            res.json(response).end();
        } else {
            //update reservation status
            Reservations.findOne({ where: { id: data.reservationId } })
                .then(reservation => {
                    return reservation.updateAttributes({ reservationStatus: constants.RESERVATION_STATUS.STAYING, update_at: new Date() })
                })
                .then(reservation => {
                    return Reservations.app.models.Rooms.updateAll({ id: reservation.roomId }, { currentReservation: data.reservationId, roomStatus: constants.ROOM_STATUS.STAYING })
                })
                .then(count => {
                    let response = new CommonResponse(true, 'check-in success', {});
                    res.json(response).end();
                })
                .catch(err => {
                    res.json(err)
                })
        }
    }

    Reservations.checkout = (data, res, next) => {
        if (!data.reservationId) {
            let response = new CommonResponse(false, 'Missing reservationId params', {});
            res.json(response).end();
        } else {
            //update reservation status
            res.locals.reservationId = data.reservationId
            Reservations.findOne({ where: { id: data.reservationId } })
                .then(reservation => {
                    return reservation.updateAttributes({ reservationStatus: constants.RESERVATION_STATUS.CHECKOUT, update_at: new Date(), checkout: new Date(), remainMoney: 0 })
                })
                .then(reservation => {
                    return Reservations.app.models.Rooms.updateAll({ id: reservation.roomId }, { currentReservation: "", roomStatus: constants.ROOM_STATUS.EMPTY })
                })
                .then(count => {
                    let response = new CommonResponse(true, 'check-out success', {});
                    res.json(response).end();
                })
                .catch(err => {
                    res.json(err)
                })
        }
    }

    Reservations.searchHome = (country_code, province_code, district_code, homeName, checkin, checkout, roomTypeId, numGuest, minCost, maxCost, skip, limit, res) => {
        homeController.searchHome(country_code, province_code, district_code, homeName, checkin, checkout, roomTypeId, numGuest, minCost, maxCost, skip, limit)
            .then(result => {
                var temp = result.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list room on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: result.length })
                res.json(response);
                // res.json(result)
            })
            .catch(err => {
                res.status(400).json(err)
            })
    }

    //seach home address by text search
    Reservations.searchHomeAddress = (searchText, res) => {
        var country, province, district, result;
        Reservations.app.models.Country.find({ where: { countryName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['countryName', 'countryCode'] })
            .then(countries => {
                if (countries) {
                    country = countries;
                }
                return Reservations.app.models.Province.find({ where: { name: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['name', 'code'] })
            })
            .then(provinces => {
                if (provinces) {
                    province = provinces;
                }
                return Reservations.app.models.District.find({
                    where: { name: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                    fields: ['name', 'code', 'province_code', 'path_with_type']
                })
            })
            .then(districts => {
                if (districts) {
                    district = districts;
                }
                return Reservations.app.models.Homes.find({ where: { homeName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['homeName', 'address'] })
            })
            .then(homes => {
                let response = new CommonResponse(true, 'result', { address: { country: country, province: province, district: district }, homes: { home: homes } });
                res.json(response)
            })
            .catch(err => {
                let response = new CommonResponse(true, 'err', err);
                res.json(response)
            })
    }

    Reservations.getListReservationOfRoom = (roomId, skip, limit, res) => {
        Reservations.find({ where: { roomId: roomId }, skip: skip, limit: limit })
            .then(reservations => {
                res.json(reservations)
            })
            .catch(err => {
                res.status(400).json(err)
            })
    }

    //search home had empty room
    Reservations.searchHome2 = (country_code, province_code, district_code, homeName, checkin, checkout, roomTypeId, numGuest, minCost, maxCost, skip, limit, res) => {
        var filter;
        var homesResult = [], promises = [];
        if (homeName && homeName != "") {
            filter = Object.assign({}, filter, { homeName: homeName })
        }
        if (district_code && district_code != "") {
            filter = Object.assign({}, filter, { "address.district_code": district_code })
        } else if (province_code && province_code != "") {
            filter = Object.assign({}, filter, { "address.province_code": province_code })
        } else if (country_code && country_code != "") {
            filter = Object.assign({}, filter, { "address.country_code": country_code })
        }
        Reservations.app.models.Homes.find({
            where: filter, skip: skip, limit: limit
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
            .then(homes => {
                forEach(homes, (homeItem, homeIndex) => {
                    var roomsResult = [];
                    console.log('1')
                    promises.push(Reservations.app.models.Rooms.find({ where: { homeId: homeItem.id, roomTypeId: roomTypeId, roomDatePrice: { lt: maxCost }, roomDatePrice: { gt: minCost } } })
                        .then(rooms => {

                            forEach(rooms, (roomItem, index) => {
                                //check reservation in room
                                console.log('roomItem', roomItem.roomName)
                                var numReservations = [], promiseReservation = [];
                                forEach(roomItem.listReservation, (reservationId, index) => {
                                    promiseReservation.push(Reservations.find({
                                        where: {
                                            id: reservationId, checkin: { lt: checkout }, checkin: { gt: checkin }
                                            , checkout: { lt: checkout }, checkout: { gt: checkin }
                                            // or: [{ checkin: { beetween: [checkin, checkout] } }, { checkout: { beetween: [checkin, checkout] } }]
                                        }
                                    })
                                        .then(reservations => {
                                            if (reservations.length > 0) {
                                                console.log('111')
                                                numReservations.push(reservationId)
                                            }
                                        })
                                    )
                                })
                                return Q.all(promiseReservation)
                                    .then(result => {
                                        if (numReservations.length == 0) {
                                            console.log('2')
                                            roomsResult.push(roomItem)
                                        }
                                    })
                                    .then(() => {
                                        var remainGuest = 0;
                                        console.log('roomsResult.length', roomsResult.length)
                                        roomsResult.map(room => {
                                            remainGuest += room.maxGuest;
                                            console.log('remainGuest', remainGuest)
                                        })
                                        if (remainGuest >= numGuest) {
                                            console.log('xxx')
                                            homesResult.push(homeItem)
                                        }
                                    })
                            })

                        })
                    )
                })
                console.log('1xx')
                return Q.all(promises)
            })
            .then(() => {
                console.log('3')
                res.json(homesResult)
            })
            .catch(err => {
                console.log(err)
                res.json(err)
            })
    }

    //list all rooms of a home
    Reservations.listRoomOfHome = (homeId, skip, limit, checkin, checkout, numGuest, res) => {
        let roomsResult = [];
        Reservations.app.models.Rooms.find({
            where: { homeId: homeId },
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
                relation: 'inFurnitures'
            }, {
                relation: 'room_utilities',
                scope: {
                    fields: ['name', 'icon_link'],

                }
            }]
        })
            .then(rooms => {
                var promiseReservation = [];
                forEach(rooms, (roomItem, index) => {
                    //check reservation in room
                    if (roomItem.maxGuest >= numGuest) {
                        console.log("maxGuests- guests: ", roomItem.maxGuest, numGuest)
                        promiseReservation.push(
                            roomController.checkStatusOfRoom(roomItem.id, checkin, checkout)
                                .then(result => {
                                    console.log('resultzzzz', result)
                                    if (result.status == constants.ROOM_STATUS.EMPTY) {
                                        console.log('2')
                                        roomsResult.push(roomItem)
                                    }
                                })
                        )
                    }
                })
                return Q.all(promiseReservation)
            })
            .then(() => {
                console.log('roomsResult', roomsResult)
                var temp = roomsResult.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list room on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: roomsResult.length })
                res.json(response);
            })
            .catch(err => {
                console.log('err', err)
                res.status(400).json(err)
            })
    }

    //check status of list home
    Reservations.checkRoomsStatus = (roomIds, checkin, checkout, res) => {
        roomController.checkStatusOfRooms(roomIds, checkin, checkout)
            .then(result => {
                res.json(result)
            })
            .catch(err => {
                res.json(err)
            })
    }

    Reservations.cancel = (data, res, next) => {
        if (!data.reservationId) {
            let response = new CommonResponse(false, 'Missing reservationId params', {});
            res.json(response).end();
        } else {
            //update reservation status
            Reservations.findOne({ where: { id: data.reservationId } })
                .then(reservation => {
                    return reservation.updateAttributes({ reservationStatus: constants.RESERVATION_STATUS.CANCELED, update_at: new Date() })
                })
                .then(reservation => {
                    return Reservations.app.models.Rooms.updateAll({ id: reservation.roomId }, { currentReservation: "", roomStatus: constants.ROOM_STATUS.EMPTY })
                })
                .then(count => {
                    let response = new CommonResponse(true, 'cancel success', {});
                    res.json(response).end();
                })
                .catch(err => {
                    res.json(err)
                })
        }
    }

    //book 1 room
    Reservations.createReservation1 = (roomId, customerEmail, customerName, customerPhone, bookingSource, checkin, checkout, totalMoney, prePay, payMethod, guestNumber, userId, sellerId, bookerId, res, next) => {
        var Customer = Reservations.app.models.Customer;
        var Room = Reservations.app.models.Rooms;
        Customer.findOne({ where: { customerEmail: customerEmail } })
            .then(customer => {
                if (!customer) {
                    return Customer.create({
                        customerEmail: customerEmail,
                        customerName: customerName,
                        customerPhone: customerPhone,
                        create_at: new Date(),
                        update_at: new Date()
                    })
                } else {
                    console.log('customer is exist!')
                    return Customer.findOne({ where: { customerEmail: customer.customerEmail } })
                }
            })
            .then(customer => {
                var count = randomString.generate(6).toUpperCase();
                var booking_code = 'VNL-' + count;
                return Reservations.create({
                    roomId: roomId,
                    customerId: customer.id,
                    bookingSource: bookingSource,
                    checkin: checkin,
                    checkout: checkout,
                    totalMoney: totalMoney,
                    reservationStatus: constants.RESERVATION_STATUS.BOOKING,
                    prePay: prePay,
                    booking_code: booking_code,
                    payMethod: payMethod,
                    guestNumber: guestNumber,
                    sellerId: sellerId,
                    bookerId: bookerId,
                    create_by: userId,
                    update_by: userId
                })
            })

            .then(reservation => {
                res.locals.reservationId = reservation.id;
                return Room.findById(roomId)
            })
            .then(room => {
                room.listReservation.push(res.locals.reservationId)
                return room.save();
            })
            .then(roomUpdated => {
                res.json(new CommonResponse(true, "booking room success", {}));
                next();
            })
            .catch(err => {
                console.log(err)
                res.status(400).json(err)
            })
    }

    //book many room
    Reservations.createReservation = (rooms, customerEmail, customerName, customerPhone, bookingSource, checkin, checkout, payMethod, userId, sellerId, bookerId, res) => {
        reservationController.createReservation(rooms, customerEmail, customerName, customerPhone, bookingSource, checkin, checkout, payMethod, userId, sellerId, bookerId, res)
            .then(result => {
                res.json(result).end();
            })
            .catch(err => {
                let response = new CommonResponse(true, 'cancel success', err);
                res.json(response).end();
            })
    }

    Reservations.getReservationsByStatus = (reservationStatus, numDays, skip, limit, res) => {
        var date = new Date();
        date.setHours(0, 0, 0);
        var time = date.getTime() - (numDays - 1) * 24 * 60 * 60 * 1000;
        console.log('time: ' + numDays);
        var query;
        switch (reservationStatus) {
            case 1: //booking
                query = { create_at: { gte: new Date(time) } }
                break;
            case 2://staying
                query = { or: [{ reservationStatus: constants.RESERVATION_STATUS.STAYING }, { checkout: { between: [new Date(time), new Date()] } }] }
                break;
            case 3://checkin
                query = {
                    or: [{ reservationStatus: constants.RESERVATION_STATUS.STAYING, update_at: { gte: new Date(time) } }
                        , { reservationStatus: constants.RESERVATION_STATUS.CHECKOUT, checkin: { gte: new Date(time) } }]
                }
                break;
            case 4://checkout
                query = { reservationStatus: constants.RESERVATION_STATUS.CHECKOUT, checkout: { between: [new Date(time), new Date()] } }
                break;
            case 5://cancel
                query = { reservationStatus: constants.RESERVATION_STATUS.CANCELED, update_at: { gte: new Date(time) } }
                break;
        }
        console.log('query : ', query)
        Reservations.find({
            where: query,
            include: [{
                relation: 'room',
                scope: {
                    include: [{
                        relation: 'roomCatalog'
                    }, {
                        relation: 'homes'
                    }]
                }
            }, {
                relation: 'customer'
            }],
        })
            .then(reservations => {
                console.log('reser ', reservations)
                let response = new CommonResponse(true, 'list reservations ', reservations);
                res.json(response).end();
            })
            .catch(err => {
                res.json(err)
            })
    }

    Reservations.countReservationByStatus = (numDays, res) => {
        console.log('numdays ', numDays)
        var date = new Date();
        date.setHours(0, 0, 0);
        var time = date.getTime() - (numDays - 1) * 24 * 60 * 60 * 1000;
        var count1 = Reservations.find({
            where: {
                // or: [{ reservationStatus: constants.RESERVATION_STATUS.STAYING, update_at: { gte: new Date(time) } }
                //     , { reservationStatus: constants.RESERVATION_STATUS.CHECKOUT, checkin: { gte: new Date(time) } }]
                create_at: { gte: new Date(time) }
            }
        });
        var count2 = Reservations.find({ where: { reservationStatus: constants.RESERVATION_STATUS.CHECKOUT, checkout: { between: [new Date(time), new Date()] } } });
        var count3 = Reservations.app.models.Rooms.find({ where: { roomStatus: { inq: [constants.ROOM_STATUS.STAYING, constants.ROOM_STATUS.BOOKING] } } })
        var count4 = Reservations.app.models.Rooms.find();
        Promise.all([count1, count2, count3, count4])
            .then(listnumreservation => {
                console.log("list ", listnumreservation[0])
                var result = listnumreservation.map(x => x.length);
                console.log('result', result)
                let response = new CommonResponse(true, 'count rooms by status ', result);
                res.json(response).end();
            })
            .catch(err => {
                res.json(err)
            })
    }

    //list reservation
    Reservations.reservations = (skip, limit, res, req) => {
        reservationController.getAllReservation(skip, limit)
            .then(result => {
                let response = new CommonResponse(true, 'list reservation', result)
                res.json(response).end();
            })
            .catch(err => {
                let response = new CommonResponse(true, 'err', err)
                res.json(response).end();
            })
    }

    Reservations.remoteMethod('checkRoomsStatus', {
        accepts: [
            { arg: 'roomIds', type: 'array' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/checkRoomsStatus', verb: 'get' },
        description: 'check status of list room'
    })

    Reservations.remoteMethod('createReservation1', {
        accepts: [
            { arg: 'roomId', type: 'string' },
            { arg: 'customerEmail', type: 'string' },
            { arg: 'customerName', type: 'string' },
            { arg: 'customerPhone', type: 'string' },
            { arg: 'bookingSource', type: 'string' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'totalMoney', type: 'number' },
            { arg: 'prePay', type: 'number' },
            { arg: 'payMethod', type: 'string' },
            { arg: 'guestNumber', type: 'number' },
            { arg: 'userId', type: 'string' },
            { arg: 'sellerId', type: 'string' },
            { arg: 'bookerId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/xxxxx', verb: 'post' },
        description: 'book room'
    })

    Reservations.remoteMethod('createReservation', {
        accepts: [
            { arg: 'rooms', type: 'array' },
            { arg: 'customerEmail', type: 'string' },
            { arg: 'customerName', type: 'string' },
            { arg: 'customerPhone', type: 'string' },
            { arg: 'bookingSource', type: 'string' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'payMethod', type: 'string' },
            { arg: 'userId', type: 'string' },
            { arg: 'sellerId', type: 'string' },
            { arg: 'bookerId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/createReservation', verb: 'post' },
        description: 'book room'
    })


    Reservations.remoteMethod('reservations', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllReservations', verb: 'get' },
        description: 'get all reservations'
    })

    Reservations.remoteMethod('getListReservationOfRoom', {
        accepts: [
            { arg: 'roomId', type: 'string' },
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/reservationOfRoom', verb: 'get' },
        description: 'get all reservations of a room'
    })

    Reservations.remoteMethod('listRoomOfHome', {
        accepts: [
            { arg: 'homeId', type: 'string' },
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'numGuest', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/listRoomOfHome', verb: 'get' },
        description: 'get all room of a home'
    })

    Reservations.remoteMethod('searchHomeAddress', {
        accepts: [
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/searchHomeAddress', verb: 'get' },
        description: 'search home address'
    })

    Reservations.remoteMethod('checkin', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/checkin', verb: 'post' },
        description: 'check-in'
    })

    Reservations.remoteMethod('checkout', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/checkout', verb: 'post' },
        description: 'check-out'
    })

    Reservations.remoteMethod('cancel', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/cancel', verb: 'post' },
        description: 'cancel reservation'
    })

    Reservations.remoteMethod('getReservationsByStatus', {
        accepts: [{ arg: 'status', type: 'number' },
        { arg: 'numDays', type: 'number' },
        { arg: 'skip', type: 'number' },
        { arg: 'limit', type: 'number' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/getReservationsByStatus', verb: 'get' },
        description: 'get reservation by status'
    })

    Reservations.remoteMethod('searchHome2', {
        accepts: [
            { arg: 'country_code', type: 'string' },
            { arg: 'province_code', type: 'string' },
            { arg: 'district_code', type: 'string' },
            { arg: 'homeName', type: 'string' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'roomTypeId', type: 'string' },
            { arg: 'numGuest', type: 'number' },
            { arg: 'minCost', type: 'number' },
            { arg: 'maxCost', type: 'number' },
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/test', verb: 'get' },
        description: 'test'
    })

    Reservations.remoteMethod('searchHome', {
        accepts: [
            { arg: 'country_code', type: 'string' },
            { arg: 'province_code', type: 'string' },
            { arg: 'district_code', type: 'string' },
            { arg: 'homeName', type: 'string' },
            { arg: 'checkin', type: 'date' },
            { arg: 'checkout', type: 'date' },
            { arg: 'roomTypeId', type: 'string' },
            { arg: 'numGuest', type: 'number' },
            { arg: 'minCost', type: 'number' },
            { arg: 'maxCost', type: 'number' },
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/searchHome', verb: 'get' },
        description: 'search home'
    })

    Reservations.remoteMethod('countReservationByStatus', {
        accepts: [{ arg: 'numDays', type: 'number' },
        { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'res', type: 'Object', root: true },
        http: { path: '/countReservation', verb: 'get' },
        description: 'count reservation'
    })

    Reservations.afterRemote('createReservation', (ctx, remoteMethodOutput, next) => {
        console.log('after book room ', ctx.res.locals.reservationId)
        var reservationId = ctx.res.locals.reservationId;
        Reservations.findOne({
            where: { id: reservationId },
            include: [{
                relation: 'room',
                scope: {
                    include: [{
                        relation: 'roomCatalog'
                    }, {
                        relation: 'homes'
                    }]
                }
            }, {
                relation: 'customer'
            }]
        })
            .then(reservationResult => {
                var object = Object.assign({}, {}, reservationResult)
                var reservation = object.__data;
                console.log('reservation: ', reservation.room)
                var room = Object.assign({}, {}, reservation.room)
                var roomCatalog = room.__data.roomCatalog;
                var homes = room.__data.homes;
                var checkinDate = reservation.checkin;
                var checkoutDate = reservation.checkout;
                var checkin_day = checkinDate.getDate() + '-' + (checkinDate.getMonth() + 1) + '-' + checkinDate.getFullYear();
                var checkout_day = checkoutDate.getDate() + '-' + (checkoutDate.getMonth() + 1) + '-' + checkoutDate.getFullYear();
                var payload = {
                    booking_code: reservation.booking_code,
                    room_name: reservation.room.roomName,
                    room_type: roomCatalog.catalogName,
                    home_name: homes.homeName,
                    guests: reservation.guestNumber,
                    home_address: homes.address.address_text,
                    customer_email: reservation.customer.customerEmail,
                    total: reservation.totalMoney + ' VND',
                    pre_pay: reservation.prePay + ' VND',
                    checkin: checkin_day,
                    checkout: checkout_day
                }
                console.log(payload)
                var html = swig.renderFile(path.join(__dirname, '../../server', 'template', 'email_booking.ejs'), payload);
                Reservations.app.models.Email.send({
                    to: reservation.customer.customerEmail,
                    from: "vinalanddev2019@gmail.com",
                    subject: 'BOOKING SUCCESS',
                    text: 'Your booking is success. Detail information is described at follow file',
                    html: html
                }, function (err, mail) {
                    if (err) {
                        console.log('mail not send : ' + err);
                    }
                    if (mail) {
                        console.log('email sent!');
                    }
                })
            })

    })

    Reservations.disableRemoteMethodByName('exists')
    Reservations.disableRemoteMethodByName('replaceOrCreate')
    Reservations.disableRemoteMethodByName('upsertWithWhere')
    Reservations.disableRemoteMethodByName('replaceOrCreate')
    Reservations.disableRemoteMethodByName('updateAttributes')
    Reservations.disableRemoteMethodByName('upsert')
    Reservations.disableRemoteMethodByName('create')
    Reservations.disableRemoteMethodByName('change-stream', true)
};