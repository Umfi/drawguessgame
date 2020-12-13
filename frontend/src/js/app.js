// Helper Functions
function sanitizeString(str){
    str = str.replace(/[^a-z0-9 \.,!?_-]/gim,"");
    return str.trim();
}

// ============== Model ========================= 
const userData = {
    'name': "",
    'country': ""
};

const websocketGame = {
    // indicates if it is drawing now.
    isDrawing: false,
    // the starting point of next line drawing.
    startX: 0,
    startY: 0,
    // Contants
    LINE_SEGMENT: 0,
    CHAT_MESSAGE: 1,
    GAME_LOGIC: 2,
    CLEAR_SCREEN: 3,
    //Game Events
    JOIN: 0,
    LEAVE: 1,
    WIN: 2,
    // Constant for game logic state
    WAITING_TO_START: 0,
    GAME_START: 1,
    GAME_OVER: 2,
    // Logic
    isTurnToDraw: false,
    currentColor: "black",
    currentLineWidth: 1,
    time: 60,
    timerInterval: 0
};

// ============== View ========================= 
class GameView {
    init() {
        console.log("Start Drawing Guess Game");
        this.renderScreen();
        this.enableRegistration();
        this.initDrawingTools();
        this.initCanvas();
    }

    renderScreen() {

        const user = app.getUser();

        if (user.name === "") {
            this.showSetupScreen();
            this.hideGameScreen();
        } else {
            this.showGameScreen();
            this.hideSetupScreen();
            app.initGame();
        }
    }

    showSetupScreen() {
        $("#setup").show();
    }
    hideSetupScreen() {
        $("#setup").hide();
    }

    showGameScreen() {
        $("#game").show();
    }
    hideGameScreen() {
        $("#game").hide();
    }

    disableCreateAccountBtn() {
        $("#save_username_btn").prop('disabled', true);
    }

    enableCreateAccountBtn() {
        $("#save_username_btn").prop('disabled', false);
    }

    checkCreateAccountBtnState() {
        if ($("#username").val() != "" && $("#country").val() != "") {
            this.enableCreateAccountBtn();
        } else {
            this.disableCreateAccountBtn();
        }
    }

    enableRegistration() {
        document.getElementById('username').addEventListener("change", (event ) => {
            this.checkCreateAccountBtnState();
        });
        document.getElementById('country').addEventListener("change", (event ) => {
            this.checkCreateAccountBtnState();
        });

        document.getElementById('save_username_btn').addEventListener("click", (event ) => {
            this.registrationBtnClicked();
        });

        document.getElementById('geolocation').addEventListener("click", (event ) => {
            app.setGeoLocation();
        });

        this.disableCreateAccountBtn();
    }

    registrationBtnClicked() {
        var userName = $("#username").val();
        var country = $("#country").val();
        app.completeSetup(userName, country);
    }

    setCountryValue(country) {
        $("#country").val(country);
        this.checkCreateAccountBtnState();
    }

    enableChat() {

        var message = function generateMessageText() {
            return  $("#chat-input").val();
        }

        document.getElementById('chat-input').addEventListener('keypress', (event) => {
            if (event.key == 'Enter') {
                app.sendMessage(message(), websocketGame.CHAT_MESSAGE, false);
                $("#chat-input").val("");
            }
        });

        document.getElementById('send').addEventListener('click', (event) => {
            app.sendMessage(message(), websocketGame.CHAT_MESSAGE, false);
            $("#chat-input").val("");
        });
    }

    showDrawingTools() {
        $("#drawingtools").removeClass("disabled");
    }

    hideDrawingTools() {
        $("#drawingtools").addClass("disabled");
    }
    
    clearCanvas(){
        var canvas = document.getElementById('drawing-pad');
        canvas.width = canvas.width;
    }

    clearChat(){
        $("#chat-history").html("");
    }
    
    writeToChat(message){
        $("#chat-history").append("<li>"+message+"</li>");
    }
    
    initDrawingTools(){
    
        // Handle colors
        var colors = document.getElementsByClassName('colors')[0];

        colors.addEventListener('click', function(event) {
            app.setCurrentColor(event.target.value || 'black');
        });

        // Handle brushes
        var brushes = document.getElementsByClassName('brushes')[0];

        brushes.addEventListener('click', function(event) {
            app.setCurrentLineWidth(event.target.value || 1);
        });

        // Handle clear screen button
        document.getElementById('clearScreenBtn').addEventListener('click', function(event) {
            app.clearCanvas();
        });
    }

    drawLine(x1, y1, x2, y2, color, lineWidth) {
        var canvas = document.getElementById('drawing-pad');
        var ctx = canvas.getContext('2d');
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    
    initCanvas(){
        document.getElementById('drawing-pad').addEventListener('mousedown', (event) => {
            var mouseX = event.offsetX || 0;
            var mouseY = event.offsetY || 0;
            app.startDrawing(mouseX, mouseY);
        });

        document.getElementById('drawing-pad').addEventListener('mouseup', (event) => {
            app.stopDrawing();
        });

        document.getElementById('drawing-pad').addEventListener('mousemove', (event) => {
            var mouseX = event.offsetX || 0;
            var mouseY = event.offsetY || 0;
            app.draw(mouseX, mouseY);
        });
    }
    
    updateTimer(time){
        $('#countdown-number').html(time);
    }

    playSound(gameEvent) {
        if (gameEvent === websocketGame.JOIN) {
            var audio = new Audio('http://127.0.0.1/audio/join.wav');
            audio.play();
        }
        else if (gameEvent === websocketGame.LEAVE) {
            var audio = new Audio('http://127.0.0.1/audio/leave.wav');
            audio.play();
        }
        else if (gameEvent === websocketGame.WIN) {
            var audio = new Audio('http://127.0.0.1/audio/win.wav');
            audio.play();
        }
    }
}

const gameView = new GameView();

//================ Controller ================== 
class GameController {
    constructor(gameView) {
        this.gameView = gameView;
    }

    init() {
        this.gameView.init();
    }

    getUser() {
        if (localStorage.getItem("userData") === null) {
            return userData;
        } else {
            return JSON.parse(localStorage.getItem("userData"));
        }
    }

    setGeoLocation() {
        var that = this;

        navigator.geolocation.getCurrentPosition(function(location) {
            var lat = location.coords.latitude;
            var lng = location.coords.longitude;

            $.get( "http://127.0.0.1:8080/location?long=" + lng + "&lat=" + lat, function( data ) {
                that.gameView.setCountryValue(data);
            });
        });
    }

    completeSetup(userName, country) {

        if (userName == "") {
            alert("Username is empty!");
            return;
        }

        if (country == "") {
            alert("Country is empty!");
            return;
        }

        userData.name = sanitizeString(userName);
        userData.country = sanitizeString(country);
        localStorage.setItem('userData', JSON.stringify(userData));
        this.gameView.renderScreen();
    }

    initGame() {
        var user = this.getUser().name;
        websocketGame.socket = new WebSocket("ws://127.0.0.1:8080?user=" + user);
        this.gameView.enableChat();
        var that = this;
        websocketGame.socket.onmessage = function(evt) {that.handleWebsocketEvents(evt); };
    }

    sendMessage(message, type, state) {

        // Dont send message when user is drawing
        if (type == websocketGame.CHAT_MESSAGE && websocketGame.isTurnToDraw) {
            alert("You cant chat while drawing!");
            return;
        }

        // pack the message into an object.
        var data = {};
        data.dataType = type;
        data.message = sanitizeString(message);
        data.gameState = state;
        websocketGame.socket.send(JSON.stringify(data));
    }
    
    setCurrentColor(color){
        websocketGame.currentColor = color;
    }
    
    setCurrentLineWidth(width){
        websocketGame.currentLineWidth = width;
    }

    clearCanvas() {
        this.gameView.clearCanvas();
        this.sendMessage("", websocketGame.CLEAR_SCREEN, false);
    }
    
    drawLine(x1, y1, x2, y2, color, width){
        this.gameView.drawLine(x1, y1, x2, y2, color, width);
    }
    
    startDrawing(mouseX, mouseY){
        websocketGame.startX = mouseX;
        websocketGame.startY = mouseY;
        websocketGame.isDrawing = true;
    }
    
    stopDrawing(){
        websocketGame.isDrawing = false;
    }
    
    draw(mouseX, mouseY){
        if (websocketGame.isDrawing) {
            if (!(mouseX === websocketGame.startX && mouseY === websocketGame.startY)) {

                // send the line segment to server
                if (websocketGame.isTurnToDraw) {

                    this.drawLine(websocketGame.startX, websocketGame.startY, mouseX, mouseY, 
                        websocketGame.currentColor, websocketGame.currentLineWidth);

                    var data = {};
                    data.dataType = websocketGame.LINE_SEGMENT;
                    data.startX = websocketGame.startX;
                    data.startY = websocketGame.startY;
                    data.endX = mouseX;
                    data.endY = mouseY;
                    data.color = websocketGame.currentColor;
                    data.thickness = websocketGame.currentLineWidth;
                    websocketGame.socket.send(JSON.stringify(data));

                    websocketGame.startX = mouseX;
                    websocketGame.startY = mouseY;
                }
            }
        }
    }

    handleWebsocketEvents(e){

        // check if the received data is chat or line segment
        console.log("onmessage event:", e.data);
        var data = JSON.parse(e.data);
        var message;
        if (data.dataType === websocketGame.CHAT_MESSAGE) {
            this.gameView.playSound(data.gameEvent);
            message = data.sender + " said: " + data.message;
            this.gameView.writeToChat(message);
        } 
        else if (data.dataType === websocketGame.LINE_SEGMENT) {
            this.drawLine(data.startX, data.startY, data.endX, data.endY, data.color, data.thickness);
        } 
        else if (data.dataType === websocketGame.CLEAR_SCREEN) {
            this.gameView.clearCanvas();
        } 
        else if (data.dataType === websocketGame.GAME_LOGIC) {
            if (data.gameState === websocketGame.GAME_OVER) {
                websocketGame.isTurnToDraw = false;
                message = data.winner + " wins! The answer is '" + data.answer + "'";
                this.gameView.writeToChat(message);

                if (data.winner === this.getUser().name) {
                    this.gameView.playSound(websocketGame.WIN);
                }
                
                this.stopTimer();
            }
            if (data.gameState === websocketGame.GAME_START) {
                // clear the Canvas.
                this.gameView.clearCanvas();
                // clear the chat history
                this.gameView.clearChat();

                if (data.isPlayerTurn) {
                    websocketGame.isTurnToDraw = true;
                    message = "Your turn to draw. Please draw '" + data.answer + "'";
                    this.gameView.writeToChat(message);
                    this.gameView.showDrawingTools();
                } else {
                    websocketGame.isTurnToDraw = false;
                    message = "Game Started. Get Ready. You have one minute to guess.";
                    this.gameView.writeToChat(message);
                    this.gameView.hideDrawingTools();
                }
                this.startTimer();
            }
        }
    }
    
    startTimer(){
        //TODO: fix off by one (or two?) error
        this.stopTimer();
        websocketGame.time = 60;
        var that = this;
        websocketGame.timerInterval = setInterval(function (){
            that.gameView.updateTimer(websocketGame.time);
            websocketGame.time--;
        }, 1000);
    }
    
    stopTimer(){
        clearInterval(websocketGame.timerInterval)
    }
}

const app = new GameController(gameView);
app.init();