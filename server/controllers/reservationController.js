'use strict'

const app = require('../server')
app.on('started', function () {
    const Reservations = app.models.Reservations;
    const Customer = app.models.Customer;
    const Room = app.models.Rooms;
    const Q = require('q')
    const forEach = require('async-foreach').forEach;
    const constants = require('../constants')
    const randomString = require('randomstring')
    const CommonResponse = require('../../server/common/common_response');

    const getAllReservation = (skip, limit, reservationStatus, checkin, checkout, searchText) =>
        new Promise((resolve, reject) => {
            let filter = {};
            if (reservationStatus) {
                filter = Object.assign({}, filter, { reservationStatus: reservationStatus })
            }

            if (checkin) {
                filter = Object.assign({}, filter, { checkin: { gte: checkin } })
            }

            if (checkout) {
                filter = Object.assign({}, filter, { checkin: { lte: checkout } })
            }

            Reservations.find({
                where: filter,
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
                .then(reservations => {
                    var temp = reservations.slice(skip, skip + limit)
                    resolve(temp)
                })
                .catch(err => {
                    reject(err)
                })
        })

    const createReservation = (rooms, customerEmail, customerName, customerPhone, bookingSource, checkin, checkout, payMethod, userId, sellerId, bookerId, res) =>
        new Promise((resolve, reject) => {
            var promises = [];
            res.locals.reservationId = [];
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
                    for (let i = 0; i < rooms.length; i++) {
                        var count = randomString.generate(6).toUpperCase();
                        var booking_code = 'VNL-' + count;
                        Reservations.create({
                            roomId: rooms[i].roomId,
                            customerId: customer.id,
                            bookingSource: bookingSource,
                            checkin: checkin,
                            checkout: checkout,
                            totalMoney: rooms[i].totalMoney,
                            reservationStatus: constants.RESERVATION_STATUS.BOOKING,
                            prePay: rooms[i].prePay,
                            booking_code: booking_code,
                            payMethod: payMethod,
                            guestNumber: rooms[i].guestNumber,
                            sellerId: sellerId,
                            bookerId: bookerId,
                            create_by: userId,
                            update_by: userId
                        })
                            .then(reservation => {
                                res.locals.reservationId.push(reservation.id);
                                return Room.findById(rooms[i].roomId)
                            })
                            .then(room => {
                                room.listReservation.push(res.locals.reservationId[i])
                                return room.save();
                            })
                            .then(roomSaved => {
                                var promisesReservation = [];
                                forEach(rooms[i].listExtraFee, (extraFeeId, index) => {
                                    promisesReservation.push(Reservations.app.models.reservation_extraFee.create({
                                        extraFeeId: extraFeeId,
                                        reservationId: res.locals.reservationId[i]
                                    })
                                        .then(result => {
                                            console.log(result)
                                        })
                                    )
                                })
                                return Q.all(promisesReservation)
                            })
                            .then(result => {
                                console.log(result)
                            })
                    }
                    return Q.all(promises)
                })

                .then(result => {
                    resolve(new CommonResponse(true, "booking room success", {}))
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })

        })

    exports.createReservation = createReservation;
    exports.getAllReservation = getAllReservation;
})