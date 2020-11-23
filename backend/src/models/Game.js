const config = require('../config/config')
const mongoose = require('mongoose')
const validator = require('validator')
const User = require('./User')
var { nanoid } = require("nanoid");

const gameSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    
    },
    hoster: { type: mongoose.Schema.ObjectId, ref: 'User' },
    players: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    rounds: {
        type: Number,
        required: true
    }
})


gameSchema.methods.generateGameCode = async function() {
    // Generate an code for the game
    const game = this
    const generated_code = nanoid(6)
    game.code = generated_code
    await game.save()
    return generated_code
}

gameSchema.methods.joinGame = async function(user) {
    const game = this

    if (game.players.indexOf(user) === -1) {
        game.players.push(user)    
        await game.save()
        return game
    } else {
        return -1
    }
}


const Game = mongoose.model('Game', gameSchema)

module.exports = Game