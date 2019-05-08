'use strict';

module.exports = function (Province) {
    Province.test = (msg, res, options) => {
        res.json(msg + " " + options.accessToken)
    }

    Province.remoteMethod('test', {
        accepts: [{
            arg: "msg", type: 'String'
        }, {
            arg: "res", type: "Object", http: { source: "res" }
        }, { arg: "options", type: "Object", http: "optionsFromRequest" }],
        returns: { arg: "MSG", type: "String", root: true }
    })
};
