const config = require('./config')

const http = require('http');
const url = require('url');

// Server code
var WebSocketServer = require('ws').Server;
var server = new WebSocketServer({ port: config.PORT });

var User = require('./game').User;
var Room = require('./game').Room;
var GameRoom = require('./game').GameRoom;
var room1 = new GameRoom();

server.on('connection', function (socket, req) {

    const queryObject = url.parse(req.url,true).query;

    var user = new User(socket, queryObject.user);
    room1.addUser(user);
    console.log("A connection established");


    //Chat
    user.socket.on("message", function (message) {
        console.log("Receive message from " + user.id + ": " + message);
        // send to all users in room.
        var msg = user.name + " said: " + message;
        room1.sendAll(msg);
    });
});

console.log("WebSocket server is running.");
console.log("Listening to port " + config.PORT + ".");


