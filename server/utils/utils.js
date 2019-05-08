'use strict'

const app = require('../server')
app.on('started', function () {
    const Reservations = app.models.Reservations;
    const Rooms = app.models.Rooms;
    const Homes = app.models.Homes;
    const Country = app.models.Country;
    const Province = app.models.Province;
    const District = app.models.District;
    const Q = require('q')
    const forEach = require('async-foreach').forEach;
    const constant = require('../constants')

    const checkStatusOfRoom = (roomId, checkin, checkout) =>
        new Promise((resolve, reject) => {
            var promises = [], invalidReservations = [], roomTemp
            Rooms.findOne({ where: { id: roomId } })
                .then(room => {
                    roomTemp = room;
                    var promisesRoom = [];
                    forEach(room.listReservation, (reservationId, index) => {
                        promises.push(
                            Reservations.findById(reservationId)
                                .then(reservation => {
                                    if ((reservation.checkin <= checkin && reservation.checkout >= checkin) || (reservation.checkin <= checkout && reservation.checkout >= checkout)) {
                                        console.log('xxx')
                                        invalidReservations.push(reservationId)
                                    }
                                })
                        )
                    })
                    return Q.all(promises)
                })
                .then(result => {
                    if (invalidReservations.length == 0) {
                        resolve({ id: roomTemp.id, name: roomTemp.roomName, status: constant.ROOM_STATUS.EMPTY })
                    } else {
                        resolve({ id: roomTemp.id, name: roomTemp.roomName, status: constant.ROOM_STATUS.BOOKING })
                    }
                })
                .catch(err => {
                    reject(err);
                })
        })

    const checkStatusOfRooms = (roomIds, checkin, checkout) =>
        new Promise((resolve, reject) => {
            var promises = [];
            roomIds.forEach(roomId => {
                promises.push(
                    checkStatusOfRoom(roomId, checkin, checkout)
                )
            })
            Promise.all(promises)
                .then(result => {
                    resolve(result)
                })
                .catch(err => {
                    reject(err);
                })
        })

    const searchHomeAddress = (searchText) =>
        new Promise((resolve, reject) => {
            var country, province, district, result;
            Country.find({ where: { countryName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['countryName', 'countryCode'] })
                .then(countries => {
                    if (countries) {
                        country = countries;
                    }
                    return Province.find({ where: { name: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['name', 'code'] })
                })
                .then(provinces => {
                    if (provinces) {
                        province = provinces;
                    }
                    return District.find({ where: { name: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, fields: ['name', 'code'] })
                })
                .then(districts => {
                    if (districts) {
                        district = districts;
                    }
                    resolve({ result: { country: country, province: province, district: district } })
                })
                .catch(err => {
                    reject(err)
                })

        })

    const searchHome = (country_code, province_code, district_code, homeName, checkin, checkout, roomTypeId, numGuest, minCost, maxCost, skip, limit) =>
        new Promise((resolve, reject) => {
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
            Homes.find({
                where: filter
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
                        console.log('1', homeItem.id)
                        promises.push(Rooms.find({ where: { homeId: homeItem.id, isActive: true, roomTypeId: roomTypeId, roomDatePrice: { lte: maxCost }, roomDatePrice: { gte: minCost } } })
                            .then(rooms => {
                                var promiseReservation = [];
                                console.log('rooms', rooms.length)
                                forEach(rooms, (roomItem, index) => {
                                    //check reservation in room
                                    console.log(roomItem.id)
                                    promiseReservation.push(
                                        checkStatusOfRoom(roomItem.id, checkin, checkout)
                                            .then(result => {
                                                console.log('resultyyy', result)
                                                if (result.status == constant.ROOM_STATUS.EMPTY) {
                                                    console.log('2')
                                                    roomsResult.push(roomItem)
                                                }
                                            })
                                    )
                                })
                                return Q.all(promiseReservation)
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

                        )
                    })
                    console.log('1xx')
                    return Q.all(promises)
                })
                .then(() => {
                    console.log('3')
                    resolve(homesResult)
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })

        })

    exports.searchHome = searchHome;
    exports.checkStatusOfRoom = checkStatusOfRoom;
    exports.checkStatusOfRooms = checkStatusOfRooms;
});