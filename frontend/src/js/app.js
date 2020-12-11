// ============== Model ========================= 
const userData = {
    'name': "",
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
    // Constant for game logic state
    WAITING_TO_START: 0,
    GAME_START: 1,
    GAME_OVER: 2,
    GAME_RESTART: 3,
    // Logic
    isTurnToDraw: false,
    currentColor: "black",
    currentLineWidth: 1
};

// ============== View ========================= 
class GameView {
    init() {
        console.log("Start Drawing Guess Game");
        this.renderScreen();
        this.enableRegistration();
        this.enableChat();
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

    enableRegistration() {
        const $submitRegistration = document.getElementById('save_username_btn');
        $submitRegistration.addEventListener("click", this.registrationBtnClicked.bind(this));
    }

    registrationBtnClicked() {
        var userName = $("#username").val();
        app.completeSetup(userName);
    }

    enableChat() {
        document.getElementById('chat-input').addEventListener('keypress', (event) => {
            if (event.key == 'Enter') {
                app.sendMessage($("#chat-input").val());
                $("#chat-input").val("");
            }
        });

        document.getElementById('send').addEventListener('click', (event) => {
            app.sendMessage($("#chat-input").val());
            $("#chat-input").val("");
        });
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
            return localStorage.getItem("userData");
        }
    }

    completeSetup(userName) {
        userData.name = userName;
        localStorage.setItem('userData', userData);
        this.gameView.renderScreen();
    }

    initGame() {
        websocketGame.socket = new WebSocket("ws://127.0.0.1:8080");
    }

    sendMessage(message) {
        // pack the message into an object.
        var data = {};
        data.dataType = websocketGame.CHAT_MESSAGE;
        data.message = message;
        websocketGame.socket.send(JSON.stringify(data));
    }
}

const app = new GameController(gameView);
app.init();