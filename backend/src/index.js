const config = require('./config');

const express = require('express');
const ws = require('ws');
const url = require('url');
const wc = require('which-country');

const app = express()


// WebSocketServer 

const wsServer = new ws.Server({noServer: true });

var User = require('./game').User;
var Room = require('./game').Room;
var GameRoom = require('./game').GameRoom;
var lobby = new GameRoom();

wsServer.on('connection', function (socket, req) {

    // Parse username from url
    const queryObject = url.parse(req.url,true).query;

    var user = new User(socket, queryObject.user);
    lobby.addUser(user);
    console.log("A connection established");
});



// Web-Server
const server = app.listen(process.env.PORT || config.PORT);

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// Routes
app.get('/location', (req, res) => {
    var long = req.query.long;
    var lat = req.query.lat;

    res.send(wc([long, lat])); 
});

console.log("WebSocket server is running.");
console.log("Listening to port " + config.PORT + ".");
