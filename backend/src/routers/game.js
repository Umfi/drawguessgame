const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const Game = require('../models/Game')

const router = express.Router()

router.post('/games/create', auth, async (req, res) => {
    
    const user = new User(req.user)
    const game = new Game({
        hoster: user,
        rounds: req.body.rounds
    })

    const code = await game.generateGameCode()
    res.status(201).send({ game, code })

})

router.post('/games/join', auth, async (req, res) => {
    
    try {
        const user = new User(req.user)
        const code = req.body.code
        const game = await Game.findOne({code: code})
        if (!game) {
            return res.status(401).send({error: 'Game not found!'})
        }
        
        if (String(game.hoster._id) == String(user._id)) {
            return res.status(401).send({error: 'Cant join own game!'})
        } else {
            const joinedGame = await game.joinGame(user._id)
    
            if (joinedGame == -1) {
                return res.status(401).send({error: 'Already joined!'})
            }

            res.send({ joinedGame })
        }


    } catch (error) {
        res.status(400).send({ error: error.message })
    }

})


module.exports = router