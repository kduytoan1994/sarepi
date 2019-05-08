
module.exports = app => {
const User = app.models.Users;
const Role = app.models.Role;
const RoleMapping = app.models.RoleMapping;
const constant = require('../constants');


Role.findOne({ where: { name: constant.USER_ROLE.ADMIN } })
    .then(roleInstant => {
        if (!roleInstant) {
            Role.create({ name: constant.USER_ROLE.ADMIN })
                .then(role => {
                    console.log('create role admin success')
                })
        } else {
            console.log('role admin existed')
        }
    })
    .catch(err => {
        console.log(err)
    })

Role.findOne({ where: { name: constant.USER_ROLE.HOME_MANAGER } })
    .then(roleInstant => {
        if (!roleInstant) {
            Role.create({ name: constant.USER_ROLE.HOME_MANAGER })
                .then(role => {
                    console.log('create role home manager success')
                })
        } else {
            console.log('role home manager existed')
        }
    })
    .catch(err => {
        console.log(err)
    })

Role.findOne({ where: { name: constant.USER_ROLE.MANAGER } })
    .then(roleInstant => {
        if (!roleInstant) {
            Role.create({ name: constant.USER_ROLE.MANAGER })
                .then(role => {
                    console.log('create role manager success')
                })
        } else {
            console.log('role manager existed')
        }
    })
    .catch(err => {
        console.log(err)
    })

Role.findOne({ where: { name: constant.USER_ROLE.STAFF } })
    .then(roleInstant => {
        if (!roleInstant) {
            Role.create({ name: constant.USER_ROLE.STAFF })
                .then(role => {
                    console.log('create role staff success')
                })
        } else {
            console.log('role staff existed')
        }
    })
    .catch(err => {
        console.log(err)
    })
}