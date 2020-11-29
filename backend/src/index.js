const config = require('./config')

// Server code
var WebSocketServer = require('ws').Server;
var server = new WebSocketServer({ port: config.PORT });

var User = require('./game').User;
var Room = require('./game').Room;
var GameRoom = require('./game').GameRoom;
var room1 = new GameRoom();

server.on('connection', function (socket) {
    var user = new User(socket);
    room1.addUser(user);
    console.log("A connection established");


    //Chat
    user.socket.on("message", function (message) {
        console.log("Receive message from " + user.id + ": " + message);
        // send to all users in room.
        var msg = "User " + user.id + " said: " + message;
        room1.sendAll(msg);
    });
});

console.log("WebSocket server is running.");
console.log("Listening to port " + config.PORT + ".");


