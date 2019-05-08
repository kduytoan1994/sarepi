module.exports = app => {
    var reservationModel = app.models.Reservations;
    var Email = app.models.Email;
    var nodeSchedule = require('node-schedule');
    var Q = require('q');
    var path = require('path');
    var swig  = require('swig');
    var rule = new nodeSchedule.RecurrenceRule();
    rule.hour = 8;
    rule.minute = 0;

    nodeSchedule.scheduleJob(rule, function () {
        console.log('start send mail')
        reservationModel.find({
            where: { payMethod: "Month"},
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
            .then(reservationResults => {
                // console.log('reservation: ', reservationResults)
                var promises = [];
                for (var i = 0; i < reservationResults.length; i++) {
                    var object = Object.assign({}, {}, reservationResults[i])
                    var reservation = object.__data;
                    // console.log('reservation: ', reservation.room)
                    var room = Object.assign({}, {}, reservation.room)
                    var homes = room.__data.homes;
                    var checkinDate = reservation.checkin;
                    var nowTime = new Date().getTime();
                    if (checkinDate.getDate() - 7 == new Date().getDate()) {
                        //get date after 7 days
                        var checkin_day = checkinDate.getDate() + '-' + (checkinDate.getMonth() + 1) + '-' + checkinDate.getFullYear();
                        var next_pay_time = nowTime + 7 * 24 * 60 * 60 * 1000;
                        var date = new Date(next_pay_time);
                        var next_pay_date = [
                            ('0' + date.getDate()).slice(-2),
                            ('0' + (date.getMonth() + 1)).slice(-2),
                            date.getFullYear()
                        ].join('-');

                        //get next money
                        console.log('room : ',room)
                        var roomPrice = room.__data.roomPrice;
                        var next_pay_amout = roomPrice * 30;
                        console.log('roomPrice', roomPrice, next_pay_amout)
                        var payload = {
                            booking_code: reservation.booking_code,
                            room_name: reservation.room.roomName,
                            home_name: homes.homeName,
                            total: reservation.totalMoney + ' VND',
                            next_payment_date: next_pay_date,
                            customer_email: reservation.customer.customerEmail,
                            checkin: checkin_day,
                            next_payment_amout: next_pay_amout + ' VND',
                            remain_money : reservation.remainMoney + ' VND'
                        }
                        console.log(payload)
                        var html = swig.renderFile(path.join(__dirname, '../../server', 'template', 'email_pay_notice.ejs'), payload);
                        promises.push(Email.send({
                            to: reservation.customer.customerEmail,
                            from: "vinalanddev2019@gmail.com",
                            subject: 'PAYMENT NOTICE',
                            text: 'You have 7 days to next payment, please pay on time! \n Thank you!',
                            html: html
                        }, function (err, mail) {
                            if (err) {
                                console.log('mail not send : ' + err);
                            }
                            if (mail) {
                                console.log('email sent!');
                            }
                        }))
                        Q.all(promises)
                            .then(result => {
                                console.log(result)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    }
                }
            })
    })
}