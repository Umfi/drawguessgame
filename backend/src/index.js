const config = require('./config/config')

const express = require('express')
const userRouter = require('./routers/user')

require('./db/db')

const app = express()

app.use(express.json())
app.use(userRouter)

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`)
})