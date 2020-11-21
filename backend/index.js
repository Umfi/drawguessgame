// Declare dependencies
const mongoose = require('mongoose');
const express = require('express');
const app = express();

const port = process.env.port || 8000;
const db_link = "mongodb://mongo:27017/drawguessdb";

// Connect to database
mongoose.connect(db_link, (err) => {
    if (err) {
        console.error("Can't connect to database!");
        console.error(err);
    } else {
        console.log("Connected to database!");
    }
});


// API Endpoints
app.get('/example', (req, res) => {
    res.send("Exampel answer 22");
});

//... add more here


// Run the server
app.listen(port, () => {
    console.log('App is running successfully on port ' + port);
});