//  Host a server on localhost:3000
var express = require('express');
var app = express();
var server = app.listen(3000);

//  Host files
app.use(express.static('public'));

//  Johnny-Five
var five = require('johnny-five');
var board = new five.Board();

// Socket.io
var socket = require('socket.io');
var io = socket(server);

// New socket connection
io.sockets.on('connection', function (socket) {
    console.log('New connection ' + socket.id);
});

board.on('ready', function () {
    button = new five.Button(2);

    // Allow direct command line access
    board.repl.inject({
        button: button
    });

    // Button pressed
    button.on('down', function () {
        console.log('down');
        buttonPressed = true;
        io.emit('buttonPressed', buttonPressed);
    });
});
