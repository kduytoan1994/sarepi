module.exports = (app) => {
    var fs = require('fs');
    app.get('/uploads/images/:uri', (req, res) => {
        var uri = req.params.uri;
        if (!fs.existsSync("./client/uploads/images/" + uri)) {
            res.json({ message: { success: "0", description: 'Uri not exist !', code: 200 }, data: {} });
        } else {
            let img = fs.readFileSync("./client/uploads/images/" + uri);
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(img);
        }
    })
}