var MongoClient = require('mongodb').MongoClient;
//Create a database named "mydb":
var url = "mongodb://daren:mypracticum@ds119490.mlab.com:19490/bcit_hive";

// setup socket.io
var express = require('express');
var app = express();
const server = require("http").Server(app); 
const port = process.env.PORT || 10002; 
var io = require("socket.io")(server); 

// nodemailer for mail setup.
var nodemailer = require('nodemailer');

// mail settings
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bcitmediaworks@gmail.com',
      pass: 'practicumd3'
    }
  });

io.on("connection", function(socket){
    socket.on("addUser", function(data){
        console.log('gets here.')
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var hiveDB = db.db("bcit_hive");

            // hard code, no longer used
            var newUser = {
                name: 'Katrhina Hernandez',
                bcit: 'A00xxxxxx',
                bEmail: 'k_hernan@bcit.ca',
                program: 'D3 Digital Design Development'
            }

            hiveDB.collection("users").insertOne(data, (err, res) => {
                console.log("New User Added");   

                // query for the newUser.
                var query = hiveDB.collection('users').find({ name: "Christian Bondoc" });
                console.log("Users listed below:");
                var result = query.each(function (err, item) {
                    console.log("item is:");
                    console.log(item);
                });

                db.close();
            });

        });
    });  
    
    // grabs users for tvapp
    socket.on("grabUsers", function(data) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var hiveDB = db.db("bcit_hive");

            var users = [];

            // query for the selected.
            var query = hiveDB.collection('users').find({ program: data });
            console.log("Users listed below:");
            var result = query.each(function (err, item) {
                if (item != null) {
                    console.log("item is:");
                    console.log(item);
                    users.push(item);
                }

                // you've reached the end of the .each()
                // send over the result to front-end
                if (item == null) {
                    socket.emit("displayUsers", users);
                }
            });

            db.close();
        });
    });

    // send mail
    socket.on("sendMail", function(data) {
        // send mail here using nodemailer.
        var mailOptions = {
            from: 'bcitmediaworks@gmail.com',
            to: data,
            subject: 'BCIT Needs You For A Project!',
            text: 'Email back to accept project.'
        };
          
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              socket.emit("successfullySent", null);
            }
        });
    });
});

server.listen(port, (err)=>{
  if (err) {
    console.log("error: " + err);
    return false; //break, exit
  }
  else {
    console.log("socket open on port " + port);
  }
});

// ALLOW ACCESS *************
app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Origin", "http://mediaworks-tv-app.herokuapp.com/");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Our first route
app.get('/', function (req, res) {
  res.send('Hello Node + GitHub! I did changes.');
});

/* Main Docs Example:

Collection name: "users";
nUser = [{
    name: 'Christian Bondoc',
    bcitID: 'A00782025', <-create restrictions only for A00, maximum 9 chars
    bEmail: 'cbondoc4@bcit.ca' <-- create restrcitions for only @bcit.ca
    program: 'Digital Design Development' <-- Get from dropdown
}];

*/