const config = require('../config/config')

const mongoose = require('mongoose')

mongoose.connect(config.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
})