'use strict'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var TweetSchema = Schema({
  tweets:[{
      username: String,
      id: String,
      comment: String,
      texto: String,
      likes: [{ type: Schema.Types.ObjectId, ref: "user" }],
      replys:[{username: String, comment: String}],
      shares:[{username:String}],
      like:Number,
      reply:Number,
      share:Number
  }],  
 
  userId: {type:Schema.Types.ObjectId,ref:"user"}

})

module.exports = mongoose.model('tweet', TweetSchema)