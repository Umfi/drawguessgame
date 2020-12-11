
var websocketGame = {
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
}
