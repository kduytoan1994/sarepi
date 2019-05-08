var CommonResponse = require('../common/common_response');
var RequestLog = require('../server').models.RequestLog;
module.exports = function () {
    return function logError(err, req, res, next) {
        console.log(err);
        if (err) {
            // if (req.logId) {
            //     RequestLog.findById(req.logId).then(log => {
            //         console.log('error occur, update RequestLog document');
            //         log.updateAttributes({ error: err }, (err, log_updated) => {
            //             if (err) {
            //                 console.log(`update RequestLog error logId ${req.logId}`, err);
            //             } else {
            //                 console.log(`update RequestLog success logId ${req.logId}`);
            //             }
            //         })
            //     })
            // }
            var result = new CommonResponse(false, err.message, null);
            res.json(result);
        }
        next();
    };
};