function CommonResponse(isSucess,description,data){
    this.isSucess = isSucess,
    this.description = description,
    this.data = data
}

CommonResponse.prototype.setStatus = function(isSucess){
    this.isSucess = isSucess;
}

CommonResponse.prototype.setDescription = function(description){
    this.description = description;
}

CommonResponse.prototype.setData = function(data){
    this.data = data;
}

module.exports = CommonResponse;