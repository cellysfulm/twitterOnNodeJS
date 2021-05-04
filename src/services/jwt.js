'use strict'

var jwt = require("jwt-simple")
var moment= require("moment")
var secret = 'honestbubble'

exports.createToken = function (user) {
    var payload = {
        sub: user._id,
        username: user.username,
        seguidores:user.seguidores,
        seguidos:user.seguidos,
        tweets:user.tweets,
        iat: moment().unix(),
        exp: moment().day(30, 'days').unix()
    }

    return jwt.encode(payload, secret)
}

