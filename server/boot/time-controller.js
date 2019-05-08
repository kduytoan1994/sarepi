module.exports = function (app) {
    for (var model in app.models) {
        app.models[model].observe('before save', function updateTimestamp(ctx, next) {
            if (ctx.instance) {
                ctx.instance.update_at = new Date();
            } else {
                ctx.data.update_at = new Date();
            }
            next();
        })
    }
};