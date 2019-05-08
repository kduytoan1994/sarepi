module.exports = app => {
    var multer = require('multer');
    var xlstojson = require("xls-to-json-lc");
    var xlsxtojson = require("xlsx-to-json-lc");
    const Home = app.models.Homes
    const nodeExcel = require('excel-export')
    const forEach = require('async-foreach').forEach;
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

    /** API path that will upload the files */
    app.post('/upload', function (req, res) {
        var exceltojson;
        upload(req, res, function (err) {
            console.log('xx', req.file)
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
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
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ error_code: 0, err_desc: null, data: result });
                });
            } catch (e) {
                res.json({ error_code: 1, err_desc: "Corupted excel file" });
            }
        })

    });

    app.get('/exportExcel', (req, res) => {
        Home.find()
            .then(homes => {
                var conf = {};
                conf.cols = [{
                    caption: 'string',
                    type: 'string'
                    , width: 15
                }, {
                    caption: 'Name',
                    type: 'string',

                },{
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
                    conf.rows.push([home.id, home.homeName, home.homeDescription,home.isActive, home.numFloor])
                })
                var result = nodeExcel.execute(conf);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
                res.end(result, 'binary');

            })
    })
}