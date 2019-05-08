'use strict'

const app = require('../server')
app.on('started', function () {
    var multer = require('multer');
    const xlstojson = require("xls-to-json-lc");
    const xlsxtojson = require("xlsx-to-json-lc");
    const nodeExcel = require('excel-export')
    const forEach = require('async-foreach').forEach;
    const Homes = app.models.Homes;
    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var upload = multer({ //multer settings
        storage: storage,
        fileFilter: function (req, file, callback) { //file filter
            if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
                return callback(new Error('Wrong extension type'));
            }
            callback(null, true);
        }
    }).single('file');

    const uploadHome = (req, res) =>
        new Promise((resolve, reject) => {
            var exceltojson;
            upload(req, res, function (err) {
                console.log('xx', req.file)
                if (err) {
                    reject({ error_code: 1, err_desc: err });
                }
                /** Multer gives us file info in req.file object */
                if (!req.file) {
                    reject({ error_code: 1, err_desc: "No file passed" });
                }
                /** Check the extension of the incoming file and 
                 *  use the appropriate module
                 */
                if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
                    exceltojson = xlsxtojson;
                } else {
                    exceltojson = xlstojson;
                }
                console.log(req.file.path);
                try {
                    exceltojson({
                        input: req.file.path,
                        output: null, //since we don't need output.json
                        lowerCaseHeaders: true
                    }, function (err, result) {
                        console.log(result)
                        if (err) {
                            reject({ error_code: 1, err_desc: err, data: null });
                        }
                        resolve({ error_code: 0, err_desc: null, data: result });
                    });
                } catch (e) {
                    reject({ error_code: 1, err_desc: "Corupted excel file" });
                }
            })
        })

    const exportHomes = (req, res) =>
        new Promise((resolve, reject) => {
            Homes.find()
                .then(homes => {
                    var conf = {};
                    conf.cols = [{
                        caption: 'string',
                        type: 'string'
                        , width: 15
                    }, {
                        caption: 'Name',
                        type: 'string',

                    }, {
                        caption: 'Description',
                        type: 'string',

                    }, {
                        caption: 'Active',
                        type: 'bool'
                    }, {
                        caption: 'Floor',
                        type: 'number',
                        width: 30
                    }];
                    conf.rows = []
                    forEach(homes, (home, index) => {
                        conf.rows.push([home.id, home.homeName, home.homeDescription, home.isActive, home.numFloor])
                    })
                    var result = nodeExcel.execute(conf);
                    
                    // res.end(result, 'binary');
                    resolve(result)

                })
        })


    exports.exportHomes = exportHomes;
    exports.uploadHome = uploadHome;
});