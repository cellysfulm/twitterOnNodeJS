"use strict";

// IMPORTS
var bcrypt = require("bcrypt-nodejs");
var User = require("../models/user");
var Tweet = require("../models/tweets");
var jwt = require("../services/jwt");

function codigo(req, res) {
  var user = new User();
  var tweet = new Tweet();
  var params = req.body.input;
  var lower = params.toLowerCase();
  var sep = lower.split(" ");

  switch (sep[0]) {
    case "help":
      var comandos = {};
      comandos.Información =
        "TwitterOnNodeJs 0.01, Juan Pablo Muralles Ramírez-2018109. Todos los derechos reservados";
      comandos.REGISTER = "crea un nuevo usuario.";
      comandos.LOGIN = "inicia sesión con un usuario existente.";
      comandos.ADD_TWEET = "publicar un tweet.";
      comandos.EDIT_TWEET =
        "editar un tweet. existente identificar por: (idTweet)";
      comandos.DELETE_TWEET =
        "editar un tweet. existente identificar por: (idTweet)";
      comandos.FOLLOW = "seguir a un usuario. identificar por: (username)";
      comandos.UNFOLOW =
        "dejar de seguir a un usuario. identificar por: (username)";
        comandos.REPLY =
        "responder tweet. identificar por: (id)";
        comandos.LIKE =
        "dar like a un tweet. identificar por: (id) (si da dos veces borra el like)";
        comandos. RETWEET =
        "compartir un tweet. identificar por: (id)(si da dos veces borra el retweet)";
      comandos.VIEW_TWEETS = "ver tweets de usuario, identificar por (username) ¡Advertencia!: si la cantidad de likes, replys o retweets es 0 no mostrara dichos títulos"
      comandos.ADVERTENCIA =
        "los nombres de usuario no pueden llevar espacios, las contraseñas seguras llevan espacios ;)";
      
      res.status(200).send({ HELP: comandos });
      break;

    case "register":
      user.username = sep[1];
      sep.splice(0, 2);
      var result = sep.join(" ");
      user.password = result;
      User.find({
        $or: [{ username: user.username }],
      }).exec((err, usuarios) => {
        if (err)
          return res
            .status(500)
            .send({ message: "Error en la peticion de usuarios" });

        if (usuarios && usuarios.length >= 1) {
          return res.status(500).send({ message: "El usuario ya existe" });
        } else {
          bcrypt.hash(result, null, null, (err, hash) => {
            user.password = hash;

            user.save((err, usuarioGuardado) => {
              tweet.userId = usuarioGuardado._id;
              tweet.save();
              if (err)
                return res
                  .status(500)
                  .send({ message: "Error al guardar el Usuario" });

              if (usuarioGuardado) {
                res.status(200).send({ user: usuarioGuardado });
              } else {
                res
                  .status(404)
                  .send({ message: "no se ha podido registrar el usuario" });
              }
            });
          });
        }
      });
      break;
    case "login":
      User.findOne({ username: sep[1] }, (err, user) => {
        if (err)
          return res.status(500).send({ message: "Error en la peticion" });
        //user.usuario = sep[1]

        var deleted = sep[0] + sep[1];
        sep.splice(deleted, 2);
        var result = sep.join(" ");
        console.log(result);
        // console.log(user.password);

        if (user) {
          bcrypt.compare(result, user.password, (err, check) => {
            console.log(result.bcrypt);
            console.log(check);
            if (check === true) {
              return res.status(200).send({
                token: jwt.createToken(user),
              });
            } else {
              return res
                .status(404)
                .send({
                  message: " nombre de usuario o contraseña incorrectos",
                });
            }
          });
        } else {
          return res
            .status(404)
            .send({ message: "nombre de usuario o contraseña incorrectos" });
        }
      });
      break;
    case "edit_tweet":
      var idtweet = sep[1];
      var deleted = sep[0] + sep[1];
      sep.splice(deleted, 2);
      var result = sep.join(" ");
      var idUser = req.user.sub;
      Tweet.findOne(
        { $or: [{ "tweets._id": idtweet }] },
        async (err, newData) => {
          console.log(newData.userId);
          if (idUser != newData.userId) {
            return res.status(500).send({ message: "permiso denegado" });
          } else {
            await Tweet.updateOne(
              { "tweets._id": idtweet },
              { "tweets.$.texto": result }
            );
            Tweet.findOne({ "tweets._id": idtweet }, (err, respuesta) => {
              return res.status(200).send({ message: respuesta });
            });
            if (err) return res.status(500).send({ message: "error" });
            if (!newData)
              return res
                .status(404)
                .send({ message: "no se ha podido publicar" });
          }
        }
      );
      break;

    case "add_tweet":
      sep.splice(0, 1);
      var result = sep.join(" ");
      var idUser = req.user.sub;
      var usname = req.user.username;
      Tweet.findOneAndUpdate(
        { $or: [{ userId: idUser }] },
        { $push: { tweets: { username: usname, texto: result } } },
        { new: true },
        (err, newData) => {
          if (err) return res.status(500).send({ message: "error" });
          if (!newData)
            return res
              .status(404)
              .send({ message: "no se ha podido publicar" });
          return res.status(200).send({ newData });
        }
      );

      break;
    case "like":
      var idtweet = sep[1];
      var idUser = req.user.sub;
      var likeEX = false;

      Tweet.findOne(
        {tweets: { $elemMatch: { _id: idtweet } } },
        { "tweets.$": 1 },
        (_err, resultado) => {
          if (!resultado) {
            return res.status(500).send("error");
          } else {
            for (let i = 0; i < resultado.tweets[0].likes.length; i++) {
              if (resultado.tweets[0].likes[i].equals(idUser)) {
                likeEX = true;
              }
              if (idtweet != resultado.tweets[0].likes[i]) {
                console.log("xD");
                return res.status(500).send("no existe");
              }
            }

            if (likeEX === false) {
              Tweet.findOneAndUpdate(
                { "tweets._id": idtweet },
                { $push: { "tweets.$.likes": idUser } },
                { new: true },
                async (err, datos) => {
                  await Tweet.updateOne(
                    { "tweets._id": idtweet },
                    { $inc: { ["tweets.$.like"]:  1 } },
                  );
                  if (err)
                    return res.status(500).send({ message: "aasasasas" });
                  if (!datos)
                    return res
                      .status(404)
                      .send({ message: "no se ha podido publicar" });
                  return res.status(200).send({ datos });
                }
              );
            } else {
              Tweet.findOneAndUpdate(
                { "tweets._id": idtweet },
                { $pull: { "tweets.$.likes": idUser } },
                { new: true },
              async  (err, datos) => {
                await Tweet.updateOne(
                { "tweets._id": idtweet },
                { $inc: { ["tweets.$.like"]:  -1 } },
              );  
                //   console.log(idUser);
                  if (err)
                    return res.status(500).send({ message: "aasasasas" });
                  if (!datos)
                    return res
                      .status(404)
                      .send({ message: "no se ha podido publicar" });
                  return res.status(200).send({ datos });
                }
              );
            }
          }
          console.log(resultado);
        }
      );

      break;
    case "comment":
      var idtweet = sep[1];
      sep.splice(0, 2);
      var result = sep.join(" ");
      var idUser = req.user.sub;
      var username = req.user.username;
      var text = result;

      Tweet.findOneAndUpdate(
        { "tweets._id": idtweet },
        {
          $push: { "tweets.$.comments": { username: username, comment: text } },
        },
       async (err, datos) => {
        await Tweet.updateOne(
          { "tweets._id": idtweet },
          { $inc: { ["tweets.$.reply"]:  1 } },
        ); 
          console.log(username);
          console.log(text);
          if (err) return res.status(500).send({ message: "error" });
          if (!datos)
            return res
              .status(404)
              .send({ message: "no se ha podido publicar" });
          return res.status(200).send({ message: "se agregó su comentario" });
        }
      );
      break;

    case "delete_tweet":
      var idUser = req.user.sub;
      var idtweet = sep[1];
      Tweet.findOne({ "tweets._id": idtweet }, async (err, newData) => {
        console.log(idtweet);
        if (idUser != newData.userId) {
          return res.status(500).send({ message: "permiso denegado" });
        } else {
          await Tweet.findOneAndUpdate(
            { "tweets._id": idtweet },
            { $pull: { tweets: { _id: idtweet } } },
            { new: true }
          );

          if (err) return res.status(500).send({ message: "error" });
          if (!newData)
            return res
              .status(404)
              .send({ message: "no se ha podido publicar" });
          return res.status(200).send({ message: "se eliminó correctamente" });
        }
      });

      break;
    case "follow":
      var idUser = req.user.sub;
      User.findOne({ username: { $regex: sep[1] } }, (err, nuevo) => {
        console.log(nuevo.username);
        if (sep[1] === req.user.username) {
          return res
            .status(200)
            .send({ advertencia: "no puede seguirse a usted mismo" });
        }
        User.findById(idUser, (err, resultado) => {
          // console.log(resultado.seguidos)
          for (let i = 0; i < resultado.seguidos.length; i++) {
            if (nuevo.username === resultado.seguidos[i].username)
              return res
                .status(500)
                .send({ messaga: "ya sigues a este usuario" });
            //console.log(resultado.seguidos[1])
          }
        });

        User.findByIdAndUpdate(
          idUser,
          { $push: { seguidos: { _id: nuevo._id, username: nuevo.username } } },
          { new: true },
          (err, newData) => {
            if (err) return res.status(500).send({ message: "error" });
            if (!newData)
              return res
                .status(404)
                .send({ message: "no se ha podido publicar" });
            User.findByIdAndUpdate(
              nuevo._id,
              {
                $push: {
                  seguidores: { _id: idUser, username: newData.username },
                },
              },
              { new: true },
              (err, info) => {
                return res.status(200).send({ newData });
              }
            );
          }
        );
      });
      break;
    case "unfollow":
      var idUser = req.user.sub;
      User.findOne(
        { username: { $regex: sep[1], $options: "i" } },
        (err, nuevo) => {
          User.findByIdAndUpdate(
            idUser,
            {
              $pull: { seguidos: { _id: nuevo._id, username: nuevo.username } },
            },
            { new: true },
            (err, newData) => {
              if (err) return res.status(500).send({ message: "error" });
              if (!newData)
                return res
                  .status(404)
                  .send({ message: "no se ha podido publicar" });
              User.findByIdAndUpdate(
                nuevo._id,
                {
                  $pull: {
                    seguidores: { _id: idUser, username: newData.username },
                  },
                },
                { new: true },
                (err, info) => {
                  return res.status(200).send({ newData });
                }
              );
            }
          );
        }
      );
      break;
    case "porfile":
      var perfil = {};

      User.findOne(
        { username: { $regex: sep[1], $options: "i" } },
        (err, nuevo) => {
          if (!nuevo) return res.status(404).send({ message: "no fucniona" });
          if (err) return res.status(500).send({ message: "error" });
          // console.log(nuevo._id);
          Tweet.findOne({ userId: nuevo._id }, (err, jaja) => {
            var x = jaja.tweets.length;
            console.log(x);

            perfil.Username = nuevo.username;
            perfil.tweets = x;
            perfil.Seguidos = nuevo.seguidos.length;
            perfil.seguidores = nuevo.seguidores.length;
            return res.status(200).send({ Datos_del_usuario: perfil });
          });
        }
      );
      break;
    case "view_tweets":
      User.findOne(
        { username: { $regex: sep[1], $options: "i" } },
        (err, nuevo) => {
          //  Tweet.findOne({tweets:{$elemMatch:{userId:nuevo._id}}},{"tweets.$":1},(err,resultado)=>{

          Tweet.findOne({ userId: nuevo._id }, (err, data) => {
            for (let i = 0; i < data.tweets.length; i++) {
              const element = data.tweets[i];
              console.log(element);
            }
            return res.status(200).send(data);
          });
        }
      );
      break; //desagradable xd
    case "dislike":
      var idtweet = sep[1];
      var idUser = req.user.sub;
      var likeEX = false;

      Tweet.findOne(
        { tweets: { $elemMatch: { _id: idtweet } } },
        { "tweets.$": 1 },
        (err, resultado) => {
          console.log(resultado);
          for (let i = 0; i < resultado.tweets[0].likes.length; i++) {
            if (resultado.tweets[0].likes[i].equals(idUser)) {
              likeEX = true;
            }
          }

          if (likeEX === true) {
            Tweet.findOneAndUpdate(
              { "   ._id": idtweet },
              { $pull: { "tweets.$.likes": idUser } },
              { new: true },
              (err, datos) => {
                //   console.log(idUser);
                if (err) return res.status(500).send({ message: "aasasasas" });
                if (!datos)
                  return res
                    .status(404)
                    .send({ message: "no se ha podido publicar" });
                return res.status(200).send({ datos });
              }
            );
          }
        }
      );
      break;
    case "retweet":
      var respuesta = {};
      var usuarioActual;
      var idtweet = sep[1];
      sep.splice(0, 2);
      var result = sep.join(" ");
      var idUser = req.user.sub;
      var usuariolog = req.user.username;
      var shared = false;
      var follow = 1 

      Tweet.findOne({ "tweets._id": idtweet }, (err, nuevo) => {
        for (let i = 0; i < nuevo.tweets.length; i++) {
          const element = nuevo.tweets[i];
          var idus = element;
         console.log(nuevo);
          for (let index = 0; index < nuevo.tweets[i].shares.length; index++) {
            if (nuevo.tweets[i].shares[index].username === usuariolog) {
              shared = true;
            }
           
              
            
           Tweet.findById({userid:nuevo.userId},(err,respuesta)=>{
            console.log(respuesta)
          
              
            })
          
          }
        }
        if (follow===0) {
          console.log("dale")
        }
        if (shared === false) {
        //  console.log(nuevo.userId + " " + idUser);
          if (nuevo.userId.equals(idUser)) {
            console.log("hola");
            return res.status(500).send("no puedes retweetear tus tweets")
          }else{

            Tweet.findOneAndUpdate({ $or: [{ userId: idUser }] },{$push: {
              tweets: {
              username: usuariolog,
              comment: result,
              texto: "Publicación de " + idus.username + ": " + idus.texto,
              id: idus._id,
            },
          },
        },
        { new: true },
         (err, newData) => {
          if (err) return res.status(500).send({ message: "error" });
          if (!newData)
            return res
              .status(404)
              .send({ message: " 1 no se ha podido publicar" });
          usuarioActual = newData.tweets;
        }
      );
      Tweet.findOneAndUpdate(
        { "tweets._id": idus._id },
        { $push: { "tweets.$.shares": { username: usuariolog } } },
        { new: true },
         async(err, datos) => {
          await Tweet.updateOne(
            { "tweets._id": idtweet },
            { $inc: { ["tweets.$.share"]:  1 } },
          ); 
          if (err) return res.status(500).send({ message: "error" });
          if (!datos)
            return res
              .status(404)
              .send({ message: "2 no se ha podido publicar" });
          return res.status(200).send({ datos });
          
        }
      );
          }
         
        } else {
          Tweet.findOne({"tweets.id": idtweet }, (err, resultado) => {
            // console.log(resultado);
            for (let i = 0; i < resultado.tweets.length; i++) {
              const element = resultado.tweets[i];
            //  console.log(element._id);
             // var content = element;
              var elId = element._id;
              //console.log(element);
            }

            Tweet.findOneAndUpdate({ "tweets._id": elId },{ $pull:{ tweets:{ _id: elId} } },{ new: true },
              (err, newData) => {

            
                /*console.log("content " + content.id);
                                console.log("idusid " + idus._id);*/
                if (err) return res.status(500).send({ message: "error" });
                if (!newData)
                  return res
                    .status(404)
                    .send({ message: "3 no se ha podido publicar" });

                //  return res.status(200).send({newData})
              }
            );
          });
          Tweet.findOneAndUpdate(
            {"tweets._id": idus._id },{ $pull: { "tweets.$.shares": { username: usuariolog }}},{ new: true },
            async(err, datos) => {
              await Tweet.updateOne(
                { "tweets._id": idtweet },
                { $inc: { ["tweet.$.shares"]:  -1 } },
              ); 
              if (err) return res.status(500).send({ message: "aasasasas" });
              if (!datos)
                return res
                  .status(404)
                  .send({ message: "4 no se ha podido publicar" });
              return res.status(200).send({ datos });
            }
          );
        }
      });

      break;
    case "delete_tweet":
      var idUser = req.user.sub;
      var idtweet = sep[1];
      Tweet.findOne({ "tweets._id": idtweet }, async (err, newData) => {
        console.log(idtweet);
        if (idUser != newData.userId) {
          return res.status(500).send({ message: "permiso denegado" });
        } else {
          await Tweet.findOneAndUpdate({ "tweets._id": idtweet },{ $pull: { tweets: { _id: idtweet }}},{ new: true }
          );

          if (err) return res.status(500).send({ message: "error" });
          if (!newData)
            return res
              .status(404)
              .send({ message: "no se ha podido publicar" });
          return res.status(200).send({ message: "se eliminó correctamente" });
        }
      });

      break;
    case "follow":
      var idUser = req.user.sub;
      User.findOne({ username: { $regex: sep[1] } }, (err, nuevo) => {
        console.log(nuevo.username);
        if (sep[1] === req.user.username) {
          return res
            .status(200)
            .send({ advertencia: "no puede seguirse a usted mismo" });
        }
        User.findById(idUser, (err, resultado) => {
          // console.log(resultado.seguidos)
          for (let i = 0; i < resultado.seguidos.length; i++) {
            if (nuevo.username === resultado.seguidos[i].username)
              return res
                .status(500)
                .send({ messaga: "ya sigues a este usuario" });
            //console.log(resultado.seguidos[1])
          }
        });

        User.findByIdAndUpdate(
          idUser,
          {$push:{seguidos:{ _id:nuevo._id,username:nuevo.username }}},{ new: true },(err, newData) => {
            if (err) return res.status(500).send({ message: "error" });
            if (!newData)
              return res
                .status(404)
                .send({ message: "no se ha podido publicar" });
            User.findByIdAndUpdate(
              nuevo._id,
              {
                $push: {
                  seguidores: { _id: idUser, username: newData.username },
                },
              },
              { new: true },
              (err, info) => {
                return res.status(200).send({ newData });
              }
            );
          }
        );
      });
      break;
    case "unfollow":
      var idUser = req.user.sub;
      User.findOne(
        { username: { $regex: sep[1], $options: "i" } },(err, nuevo) => {
          User.findByIdAndUpdate(idUser,{$pull: { seguidos: { _id: nuevo._id, username: nuevo.username}},},
            { new: true },
            (err, newData) => {
              if (err) return res.status(500).send({ message: "error" });
              if (!newData)
                return res
                  .status(404)
                  .send({ message: "no se ha podido publicar" });
              User.findByIdAndUpdate(
                nuevo._id,
                {
                  $pull: {
                    seguidores: { _id: idUser, username: newData.username },
                  },
                },
                { new: true },
                (err, info) => {
                  return res.status(200).send({ newData });
                }
              );
            }
          );
        }
      );
      break;
    case "porfile":
      var perfil = {};

      User.findOne(
        { username: { $regex: sep[1], $options: "i" }},(err, nuevo) => {
          if (!nuevo) return res.status(404).send({ message: "no fucniona" });
          if (err) return res.status(500).send({ message: "error" });
          // console.log(nuevo._id);
          Tweet.findOne({ userId: nuevo._id }, (err, jaja) => {
            var x = jaja.tweets.length;
            console.log(x);

            perfil.Username = nuevo.username;
            perfil.tweets = x;
            perfil.Seguidos = nuevo.seguidos.length;
            perfil.seguidores = nuevo.seguidores.length;
            return res.status(200).send({ Datos_del_usuario: perfil });
          });
        }
      );
      break;
    case "view_tweets":
      User.findOne({ username: { $regex: sep[1], $options: "i" } },(err, nuevo) => {
          //  Tweet.findOne({tweets:{$elemMatch:{userId:nuevo._id}}},{"tweets.$":1},(err,resultado)=>{

          Tweet.findOne({userId: nuevo._id },{"tweets.replys":1,"tweets.like":0,"tweets.reply":0 ,"tweets.retweet":0}, (err, data) => {
            return res.status(200).send(data);
          });
        }
      );
      break; //desagradable xd
    case "dislike":
      var idtweet = sep[1];
      var idUser = req.user.sub;
      var likeEX = false;

      Tweet.findOne({ tweets: { $elemMatch: {_id: idtweet}}},{"tweets.$": 1 },
        (err, resultado) => {
          console.log(resultado);
          for (let i = 0; i < resultado.tweets[0].likes.length; i++) {
            if (resultado.tweets[0].likes[i].equals(idUser)) {
              likeEX = true;
            }
          }

          if (likeEX === true) {
            Tweet.findOneAndUpdate({ "   ._id": idtweet },{ $pull: { "tweets.$.likes": idUser }},{ new: true },(err, datos) => {
                //   console.log(idUser);
                if (err) return res.status(500).send({ message: "aasasasas" });
                if (!datos)
                  return res
                    .status(404)
                    .send({ message: "no se ha podido publicar" });
                return res.status(200).send({ datos });
              }
            );
          }
        }
      );
      break;

    default:
    
      return res.status(200).send({error:sep[0] +" no se reconoce como un comando, escriba help para ver los comandos disponibles",
        });
  }
}

module.exports = {
  codigo,
};
