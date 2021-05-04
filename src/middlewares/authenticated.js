'use strict'

var jwt = require("jwt-simple")
var moment = require("moment")
var secret = 'honestbubble'

exports.ensureAuth = function (req, res, next) {
    var params = req.body.input
    var sep = params.split(' ')
    if(!req.headers.authorization){
        if (sep[0]==="REGISTER") {
            
            next()
        }else if(sep[0]==="LOGIN"){
           
            next()
        }else{
            return res.status(403).send({ message: 'la peticion no tiene la cabecera de autenticacion' })
       
        }
    }else{
        var token = req.headers.authorization.replace(/['"]+/g, '');

        try {
            var payload = jwt.decode(token, secret)
            if(payload.exp <= moment().unix()){
                return res.status(401).send({
                    message: 'El Token ha expirado'
                })
            }
        } catch (ex) {
            return res.status(404).send({
                message: 'El token no es valido'
            })
        }
    
        req.user = payload;
        next();
    
    }

   
}