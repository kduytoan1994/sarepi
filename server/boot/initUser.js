module.exports = app => {
    const User = app.models.Users;
    const Role = app.models.Role;
    const RoleMapping = app.models.RoleMapping;
    const constant = require('../constants');

    User.findOne({ where: { email: 'vinalanddev2019@gmail.com' } })
        .then(user => {
            if (!user) {
                User.create({
                    'email': 'vinalanddev2019@gmail.com', 'password': '123456', 'userName': 'Toan', 'role': 'admin', 'phoneNumber': '0985177294',
                    'typeJob': 'Full time', 'title': 'director', 'isActive': 'true'
                })
                    .then(adminUser => {
                        Role.findOne({ where: { name: constant.USER_ROLE.ADMIN } })
                            .then(roleInstant => {
                                if (roleInstant) {
                                    roleInstant.principals.create({
                                        principalType: RoleMapping.USER,
                                        principalId: adminUser.id
                                    })
                                } else {
                                    Role.create({ name: constant.USER_ROLE.ADMIN })
                                        .then(role => {
                                            role.principals.create({
                                                principalType: RoleMapping.USER,
                                                principalId: adminUser.id
                                            })
                                            console.log('create admin dev success!')
                                        })
                                }
                            })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
            else {
                console.log('admin dev is existed!')
            }
        })
        .catch(err => {
            console.log(err)
        });

    User.findOne({ where: { email: 'tienhoangnguyenbds@gmail.com' } })
        .then(user => {
            if (!user) {
                User.create({
                    'email': 'tienhoangnguyenbds@gmail.com', 'password': '123456', 'userName': 'Tien Hoang', 'role': 'admin', 'phoneNumber': '0985177294',
                    'typeJob': 'Full time', 'title': 'director', 'isActive': 'true'
                })
                    .then(adminUser => {
                        Role.findOne({ where: { name: constant.USER_ROLE.ADMIN } })
                            .then(roleInstant => {
                                if (roleInstant) {
                                    roleInstant.principals.create({
                                        principalType: RoleMapping.USER,
                                        principalId: adminUser.id
                                    })
                                } else {
                                    Role.create({ name: constant.USER_ROLE.ADMIN })
                                        .then(role => {
                                            role.principals.create({
                                                principalType: RoleMapping.USER,
                                                principalId: adminUser.id
                                            })
                                            console.log('create admin Tien Hoang success!')
                                        })
                                }
                            })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
            else {
                console.log('admin Tien Hoang is existed!')
            }
        })
        .catch(err => {
            console.log(err)
        });

    User.findOne({ where: { email: 'nthunga276@gmail.com' } })
        .then(user => {
            if (!user) {
                User.create({
                    'email': 'nthunga276@gmail.com', 'password': '123456', 'userName': 'Nthung', 'role': 'admin', 'phoneNumber': '0985177294',
                    'typeJob': 'Full time', 'title': 'director', 'isActive': 'true'
                })
                    .then(adminUser => {
                        Role.findOne({ where: { name: constant.USER_ROLE.ADMIN } })
                            .then(roleInstant => {
                                if (roleInstant) {
                                    roleInstant.principals.create({
                                        principalType: RoleMapping.USER,
                                        principalId: adminUser.id
                                    })
                                } else {
                                    Role.create({ name: constant.USER_ROLE.ADMIN })
                                        .then(role => {
                                            role.principals.create({
                                                principalType: RoleMapping.USER,
                                                principalId: adminUser.id
                                            })
                                            console.log('create admin Tien Hoang success!')
                                        })
                                }
                            })
                    })
            }
            else {
                console.log('admin Nthung is existed!')
            }
        })
        .catch(err => {
            console.log(err)
        });
}