'use strict'

var express = require("express")
var controller = require("../controllers/controller")

const md_auth01 = require("../middlewares/authenticated")

//RUTAS
var api = express.Router()
api.put('/codigo',md_auth01.ensureAuth, controller.codigo)

module.exports = api;