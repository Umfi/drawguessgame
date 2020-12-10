// ============== Model ========================= 
const userData = {
    'name': "",
};

// ============== View ========================= 
class GameView {
    init() {
        console.log("Start Drawing Guess Game");
        this.renderScreen();
        this.enableRegistration();
    }

    renderScreen() {

        const user = app.getUser();

        if (user.name === "") {
            this.showSetupScreen();
            this.hideGameScreen();
        } else {
            this.showGameScreen();
            this.hideSetupScreen();
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
}

const app = new GameController(gameView);
app.init();