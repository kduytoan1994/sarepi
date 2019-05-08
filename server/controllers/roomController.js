'use strict'

const app = require('../server')
app.on('started', function () {
    const Reservations = app.models.Reservations;
    const Rooms = app.models.Rooms;
    const Country = app.models.Country;
    const Province = app.models.Province;
    const District = app.models.District;
    const Q = require('q')
    const forEach = require('async-foreach').forEach;
    const constant = require('../constants')

    const checkStatusOfRoom = (roomId, checkin, checkout) =>
        new Promise((resolve, reject) => {
            var promises = [], invalidReservations = [], roomTemp
            Rooms.findOne({ where: { id: roomId, isActive: true } })
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

    exports.checkStatusOfRoom = checkStatusOfRoom;
    exports.checkStatusOfRooms = checkStatusOfRooms;
});