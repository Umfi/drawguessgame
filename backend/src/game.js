// Constants
var LINE_SEGMENT = 0;
var CHAT_MESSAGE = 1;
var GAME_LOGIC = 2;
var CLEAR_SCREEN = 3;

// Game Events
var JOIN = 0;
var LEAVE = 1;

// Constant for game logic state
var WAITING_TO_START = 0;
var GAME_START = 1;
var GAME_OVER = 2;
var GAME_RESTART = 3;

function User(socket, name) {
    this.socket = socket;
    // assign a random number to User.
    // Long enough to make duplication chance less.
    this.id = "1" + Math.floor(Math.random() * 1000000000);
    this.name = name;
}

function Room() {
    this.users = [];
}

function GameRoom() {
    // the current turn of player index.
    this.playerTurn = 0;
    this.wordsList = [
                      'apple', 'customer', 'restaurant', 'farmer', 'computer', 
                      'book', 'smartphone', 'cake', 'gun', 'ship', 'lake', 'camera',
                      'nature', 'chest', 'key', 'secretary', 'football', 'school',
                      'church', 'gate', 'contract', 'relationship', 'friendship', 
                      'music', 'war', 'alcohol', 'technology', 'homework', 'girl'
                    ];
    this.currentAnswer = undefined;
    this.currentGameState = WAITING_TO_START;
    // send the game state to all players.
    var gameLogicData = {
        dataType: GAME_LOGIC,
        gameState: WAITING_TO_START
    };
    this.sendAll(JSON.stringify(gameLogicData));
}

// inherit Room
GameRoom.prototype = new Room();

Room.prototype.addUser = function (user) {
    this.users.push(user);
    var room = this;

    // tell others that someone joins the room
    var data = {
        dataType: CHAT_MESSAGE,
        gameEvent: JOIN,
        sender: "Server",
        message: "Welcome " + user.name + " joining the party. Total connection: " + this.users.length
    };
    room.sendAll(JSON.stringify(data));

    this.handleOnUserMessage(user);

    // handle user closing
    user.socket.onclose = function () {
        console.log('A connection left.');
        room.removeUser(user);
    }
};

Room.prototype.removeUser = function (user) {
    var room = this;

    // loop to find the user
    for (var i = this.users.length; i >= 0; i--) {
        if (this.users[i] === user) {
            this.users.splice(i, 1);
        }
    }

    // tell others that someone left the room
    var data = {
        dataType: CHAT_MESSAGE,
        gameEvent: LEAVE,
        sender: "Server",
        message: user.name + " left the party. Total connection: " + this.users.length
    };
    room.sendAll(JSON.stringify(data));

    // stop game if only one player is left
    if (this.users.length < 2) {
        this.stopGame();
    }
};

Room.prototype.sendAll = function (message) {
    for (var i = 0, len = this.users.length; i < len; i++) {
        this.users[i].socket.send(message);
    }
};

Room.prototype.handleOnUserMessage = function (user) {
    var room = this;

    user.socket.on("message", function (message) {
        console.log("Receive message from " + user.id + ": " + message);
        // construct the message
        var data = JSON.parse(message);
        if (data.dataType === CHAT_MESSAGE) {
            // add the sender information into the message data object.
            data.sender = user.name;
        }
        // send to all clients in room.
        room.sendAll(JSON.stringify(data));
    });
};


GameRoom.prototype.addUser = function (user) {
    // a.k.a. super(user) in traditional OOP language.
    Room.prototype.addUser.call(this, user);
    // start the game if there are 2 or more connections
    if (this.currentGameState === WAITING_TO_START && this.users.length >= 2) {
        this.startGame();
    }
};

GameRoom.prototype.handleOnUserMessage = function (user) {
    var room = this;
    // handle on message
    user.socket.on('message', function (message) {
        console.log("[GameRoom] Receive message from " + user.id + ": " + message);
        var data = JSON.parse(message);
        if (data.dataType === CHAT_MESSAGE) {
            // add the sender information into the message data object.
            data.sender = user.name;
        }
        room.sendAll(JSON.stringify(data));
        // check if the message is guessing right or wrong
        if (data.dataType === CHAT_MESSAGE) {
            console.log("Current state: " + room.currentGameState);
            if (room.currentGameState === GAME_START) {
                console.log("Got message: " + data.message + " (Answer: " + room.currentAnswer + ")");
            }
            if (room.currentGameState === GAME_START && data.message === room.currentAnswer) {
                var gameLogicData = {
                    dataType: GAME_LOGIC,
                    gameState: GAME_OVER,
                    winner: user.name,
                    answer: room.currentAnswer
                };
                room.sendAll(JSON.stringify(gameLogicData));
                room.currentGameState = WAITING_TO_START;
                // clear the game over timeout
                clearTimeout(room.gameOverTimeout);
            }
        }
        if (data.dataType === GAME_LOGIC && data.gameState === GAME_RESTART) {
            room.startGame();
        }
    });
};

GameRoom.prototype.startGame = function () {
    var room = this;
    // pick a player to draw
    this.playerTurn = (this.playerTurn + 1) % this.users.length;
    console.log("Start game with player " + this.playerTurn
        + "'s turn.");
    // pick an answer
    var answerIndex = Math.floor(Math.random() *
        this.wordsList.length);
    this.currentAnswer = this.wordsList[answerIndex];
    // game start for all players
    var gameLogicDataForAllPlayers = {
        dataType: GAME_LOGIC,
        gameState: GAME_START,
        isPlayerTurn: false
    };
    this.sendAll(JSON.stringify(gameLogicDataForAllPlayers));
    // game start with answer to the player in turn.
    var gameLogicDataForDrawer = {
        dataType: GAME_LOGIC,
        gameState: GAME_START,
        answer: this.currentAnswer,
        isPlayerTurn: true
    };
    // the user who draws in this turn.
    var user = this.users[this.playerTurn];
    user.socket.send(JSON.stringify(gameLogicDataForDrawer));
    // game over the game after 1 minute.
    room.gameOverTimeout = setTimeout(function () {
        var gameLogicData = {
            dataType: GAME_LOGIC,
            gameState: GAME_OVER,
            winner: "No one",
            answer: room.currentAnswer
        };
        room.sendAll(JSON.stringify(gameLogicData));
        room.currentGameState = WAITING_TO_START;
    }, 60 * 1000);
    room.currentGameState = GAME_START;
};

GameRoom.prototype.stopGame = function () {
    var room = this;

    clearTimeout(room.gameOverTimeout);

    // game start for all players
    var gameLogicDataForAllPlayers = {
        dataType: GAME_LOGIC,
        gameState: GAME_OVER,
        winner: "No one",
        answer: room.currentAnswer
    };
    this.sendAll(JSON.stringify(gameLogicDataForAllPlayers));
    
    room.currentGameState = WAITING_TO_START;
};

module.exports.User = User;
module.exports.Room = Room;
module.exports.GameRoom = GameRoom;