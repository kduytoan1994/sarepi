'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var bodyParser = require('body-parser');
var path = require('path');

var app = module.exports = loopback();


app.middleware('initial', bodyParser.urlencoded({ extended: true }));

app.use('/express-status', function (req, res, next) {
  res.json({ running: true });
});

app.use(loopback.token({
  model: app.models.AccessTokens,
  currentUserLiteral: 'me'
}));

app.use(loopback.static(path.resolve(__dirname, '../client')));

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
var bootOptions = {
  "appRootDir": __dirname,
  "bootScripts": ["/server/boot/root.js", "./server/boot/authentication.js", "./server/boot/error-handler.js", "./server/boot/time-controller.js", "./server/boot/utils.js",
    "./server/boot/init_role.js", "./server/boot/init-user.js", "./server/boot/sendEmail.js",
  ]
};

boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
