'use strict';

var config = require('../../server/config.json');

module.exports = function(Container) {

    Container.afterRemote('upload', function (context, upload, next) {
        console.log('after upload' + JSON.stringify(upload));
        const ifaces = require('os').networkInterfaces();
            var address;
            Object.keys(ifaces).forEach(dev => {
                ifaces[dev].filter(details => {
                    if (details.family === 'IPv4' && details.internal === false) {
                        address = details.address;
                    }
                });
            });
        upload.result.files.file.forEach(element => {
            let { container, name } = element;
            let fullPath = "http://35.185.47.170" + ":" + config.port + "/uploads/" + container + "/" + name;
            //let fullPath = Container.app.get('url').replace(/\/$/, '') + "/server/uploads/" + container + "/" + name;
            element.name = fullPath;
        });
        next();
    });
};
