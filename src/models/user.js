'use strict'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var UserSchema = Schema({
    username: String,
    password: String,
    seguidores:[{
        username: String
    }],
    seguidos:[{
        username:String
    }],
    
})

module.exports = mongoose.model('user', UserSchema)