'use strict';

const CommonResponse = require('../../server/common/common_response');

module.exports = function (Users) {
    Users.signin = (data, res, next) => {
        console.log(`signin with data ${data}`);
        if (!data.email) {
            let response = new CommonResponse(false, 'Missing email parameters', {});
            res.json(response).end();
        }
        if (!data.password) {
            let response = new CommonResponse(false, 'Missing password parameters', {});
            res.json(response).end();
        }

        const userCredentials = {
            "email": data.email,
            "password": data.password
        };
        return Users.login(userCredentials, 'user', (err, loginToken) => {
            if (err) {
                console.log('login error', err);
                if (err.statusCode == 401) {
                    if (err.code == 'LOGIN_FAILED') {
                        return next(new Error('Login failed, your email or password is incorrect'));
                    } else {
                        return next(new Error('Login failed as the email has not been verified'));
                    }
                } else {
                    return next(err);
                }
            }
            res.json(new CommonResponse(true, 'login successed', loginToken)).end();
        })
    }

    Users.signout = (data, res, next) => {
        console.log('singout with data', JSON.stringify(data));
        if (!data.accessToken) {
            let response = new CommonResponse(false, 'Missing access token', {});
            res.json(response).end();
        }
        Users.logout(data.accessToken, (err) => {
            if (err) {
                console.log('signout error ', err);
                let response = new CommonResponse(false, 'logout failed', err);
                res.json(response);
                return;
            }
            let response = new CommonResponse(true, 'logout successed', {});
            res.json(response);
        })
    }

    Users.addUser = (email, password, userName, role, phoneNumber, title, isActive, typeJob, userId, res) => {
        const Role = Users.app.models.Role;
        const RoleMapping = Users.app.models.RoleMapping;
        Users.create({
            email: email,
            password: password,
            userName: userName,
            role: role,
            phoneNumber: phoneNumber,
            title: title,
            isActive: isActive,
            typeJob: typeJob,
            create_by: userId,
            update_by: userId,
            create_at: new Date(),
            update_at: new Date()
        })
            .then(newAccount => {
                Role.findOne({ where: { name: role } })
                    .then(role => {
                        if (role) {
                            role.principals.create({
                                principalType: RoleMapping.USER,
                                principalId: newAccount.id
                            })
                        }
                        let response = new CommonResponse(true, 'create new Account success', newAccount);
                        res.json(response);
                    })

            })
            .catch(err => {
                let response = new CommonResponse(false, 'create new Account fail', err);
                res.json(response);
            })
    }

    Users.getAllUsers = (skip, limit, name, email, role, phoneNumber, typeJob, title, isActive, searchText, res, req) => {
        var filter = {};
        if (name) {
            filter = Object.assign({}, filter, { userName: name })
        }
        if (email) {
            filter = Object.assign({}, filter, { email: email })
        }
        if (role) {
            filter = Object.assign({}, filter, { role: { inq: role } })
        }
        if (phoneNumber) {
            filter = Object.assign({}, filter, { phoneNumber: phoneNumber })
        }
        if (typeJob) {
            filter = Object.assign({}, filter, { typeJob: { inq: typeJob } })
        }
        if (title) {
            filter = Object.assign({}, filter, { title: { inq: title } })
        }
        if (isActive != null) {
            filter = Object.assign({}, filter, { isActive: { inq: isActive } })
        }
        if (searchText) {
            filter = Object.assign({}, filter, {
                or: [{ userName: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }, { email: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } },
                { phoneNumber: { "regexp": new RegExp('(' + searchText + ')' + `+`, 'i') } }]
            })
        }
        console.log(filter)
        Users.find(
            {
                where: filter, order: 'update_at DESC',
                include: [
                    {
                        relation: "create_by",
                        scope: {
                            fields: ['userName', 'email', 'phoneNumber']
                        }
                    }, {
                        relation: "update_by",
                        scope: {
                            fields: ['userName', 'email', 'phoneNumber']
                        }
                    }
                ]
            })
            .then(users => {
                var temp = users.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list users on page ", temp);
                response = Object.assign({}, response, { count: users.length })
                res.json(response).end();
            })
            .catch(err => {
                console.log(err)
            })
    }

    Users.updateUser = (id, userName, email, role, phoneNumber, typeJob, title, isActive, password, userId, res) => {
        const Role = Users.app.models.Role;
        const RoleMapping = Users.app.models.RoleMapping;
        Users.findById(id)
            .then(user => {
                var filter = { update_by: userId };
                if (userName) {
                    filter = Object.assign({}, filter, { userName: userName })
                }
                if (email) {
                    filter = Object.assign({}, filter, { email: email })
                }
                if (role) {
                    filter = Object.assign({}, filter, { role: role })
                }
                if (phoneNumber) {
                    filter = Object.assign({}, filter, { phoneNumber: phoneNumber })
                }
                if (typeJob) {
                    filter = Object.assign({}, filter, { typeJob: typeJob })
                }
                if (title) {
                    filter = Object.assign({}, filter, { title: title })
                }
                if (isActive != null) {
                    filter = Object.assign({}, filter, { isActive: isActive })
                }
                console.log('filter : ', filter)
                return user.updateAttributes(filter)
            })
            .then(userUpdated => {
                if (role) {//update role
                    console.log('nnn', role)
                    Role.findOne({ where: { name: role } })
                        .then(roleInstant => {
                            console.log('roleInstance', roleInstant)
                            RoleMapping.findOne({ where: { principalId: userUpdated.id } })
                                .then(roleMapping => {
                                    console.log('roleMapping', roleMapping)
                                    return roleMapping.updateAttributes({ roleId: roleInstant.id })
                                })
                                .then(roleMappingUpdated => {
                                    console.log('roleMappingUpdate', roleMappingUpdated)
                                    if (password) { //update pass
                                        userUpdated.updateAttribute('password', Users.hashPassword(password))
                                            .then(userUpdatePass => {
                                                var response = new CommonResponse(true, "update successfully! ", userUpdatePass);
                                                res.json(response)
                                            })
                                    } else {
                                        var response = new CommonResponse(true, "update successfully! ", userUpdated);
                                        res.json(response)
                                    }
                                })
                        })

                }

            })
            .catch(err => {
                var response = new CommonResponse(false, "fail to update user ", err);
                res.json(response)
            })
    }

    Users.search = (skip, limit, key, res, req) => {
        var filter = { userName: { "regexp": key + `*` } }
        console.log('filter', filter)
        Users.find({ where: filter })
            .then(users => {
                var temp = users.slice(skip, skip + limit);
                var response = new CommonResponse(true, "list users on page ", temp);
                console.log('responses ' + response);
                response = Object.assign({}, response, { count: users.length })
                res.json(response).end();
            })
            .catch(err => {
                console.log(err)
            })
    }

    Users.remoteMethod('search', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'key', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/search', verb: 'get' },
        description: 'search all users'
    })

    Users.remoteMethod('updateUser', {
        accepts: [
            { arg: 'id', type: 'string' },
            { arg: 'userName', type: 'string' },
            { arg: 'email', type: 'string' },
            { arg: 'role', type: 'string' },
            { arg: 'phoneNumber', type: 'string' },
            { arg: 'typeJob', type: 'string' },
            { arg: 'title', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'password', type: 'string' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/updateUser', verb: 'put' },
        description: 'update user'
    })


    Users.remoteMethod('getAllUsers', {
        accepts: [
            { arg: 'skip', type: 'number' },
            { arg: 'limit', type: 'number' },
            { arg: 'name', type: 'string' },
            { arg: 'email', type: 'string' },
            { arg: 'role', type: 'array' },
            { arg: 'phoneNumber', type: 'string' },
            { arg: 'typeJob', type: 'array' },
            { arg: 'title', type: 'array' },
            { arg: 'isActive', type: 'array' },
            { arg: 'searchText', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } },
            { arg: 'req', type: 'Object', http: { source: 'req' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/getAllUsers', verb: 'get' },
        description: 'get all users'
    })

    Users.remoteMethod('addUser', {
        accepts: [
            { arg: 'email', type: 'string' },
            { arg: 'password', type: 'string' },
            { arg: 'userName', type: 'string' },
            { arg: 'role', type: 'string' },
            { arg: 'phoneNumber', type: 'string' },
            { arg: 'title', type: 'string' },
            { arg: 'isActive', type: 'boolean' },
            { arg: 'typeJob', type: 'string' },
            { arg: 'userId', type: 'string' },
            { arg: 'res', type: 'Object', http: { source: 'res' } }],
        returns: { arg: 'result', type: Object, root: true },
        http: { path: '/addNewAccount', verb: 'post' },
        description: 'add new account'
    })
    Users.remoteMethod('signin', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } }
            , { arg: 'res', type: 'Object', http: { source: 'res' } }
        ],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/signin', verb: 'post' },
        description: 'login api for User'
    })

    Users.remoteMethod('signout', {
        accepts: [{ arg: 'data', type: 'Object', http: { source: 'body' } }
            , { arg: 'res', type: 'Object', http: { source: 'res' } }
        ],
        returns: { arg: 'result', type: 'Object', root: true },
        http: { path: '/signout', verb: 'post' },
        description: 'logout api for User'
    });

};
