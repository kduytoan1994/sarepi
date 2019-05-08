var CommonResponse = require('../common/common_response');
module.exports = function (app) {
    var remotes = app.remotes();
    remotes.after('**',(ctx,next)=>{
        if(ctx){
            let status = ctx.res.statusCode;
            if(status && status === 200){
                let response = new CommonResponse(true,'successed',ctx.result);
                ctx.result = response;
            }
        }
        next();
    })
    // function modifyResponse(ctx, model, next) {
    //     var status = ctx.res.statusCode;
    //     if (status && status === 200) {
    //         let response = new CommonResponse(true, 'successed', ctx.result);
    //         ctx.result = response;
    //     }
    //     //ctx.res.status(status).end();
    //     //ctx.done();
    //     next(ctx.res.result);
    // }

    // for (var model in app.models) {
    //     app.models[model].afterRemote('**', modifyResponse);
    // }
    //app.models.Notifications.afterRemote('**',modifyResponse);
};