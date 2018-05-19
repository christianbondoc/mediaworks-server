var MongoClient = require('mongodb').MongoClient;
//Create a database named "mydb":
var url = "mongodb://daren:mypracticum@ds119490.mlab.com:19490/bcit_hive";

// setup socket.io
var express = require('express');
var app = express();
var cors = require('cors');

const server = require("https").Server(app); 
const port = process.env.PORT || 10002; 
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const PORT = process.env.PORT || 5000;

// Multi-process to utilize all CPU cores.
if (cluster.isMaster) {
    console.error(`Node cluster master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
    });

} else {
    const app = express();

    // Priority serve any static files.
    app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

    // Answer API requests.
    app.get('/api', function (req, res) {
        res.set('Content-Type', 'application/json');
        res.send('{"message":"Hello from the custom server!"}');
    });

    // All remaining requests return the React app, so it can handle routing.
    app.get('*', function (request, response) {
        response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
    });

    app.listen(PORT, function () {
        console.error(`Node cluster worker ${process.pid}: listening on port ${PORT}`);
    });
}
var io = require("socket.io")(server); 


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
    res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
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