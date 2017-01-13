// Test import
console.log("Hunter X Hunter!");

var json_data;

$(document).ready(function() {

    //json_data = document.getElementById('json').innerText
    //createSocket()

    //json_data = $.parseJSON(json_data)


     // Note that the path doesn't matter for routing; any WebSocket
    // connection gets bumped over to WebSocket consumers
    socket = new WebSocket("ws://" + window.location.host + '/pumpkin');
    console.log(socket)

    socket.onmessage = function(e) {
        console.log(e.data);
        json_data = $.parseJSON(e.data)['board'];
        draw();

    }


    socket.onopen = function() {
        message_data = {
            'start': true,
            'step': true
        }
        socket.send(JSON.stringify(message_data));
    }

    if (socket.readyState == WebSocket.OPEN) socket.onopen();

    // Call onopen directly if socket is already open
    $('#button-step').click( function() {

        message_data = {
            'start': false,
            'step': true
        }
        socket.send(JSON.stringify(message_data));

    })





})

function draw() {

    var canvas = document.getElementById("board");
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = 500;
    ctx.canvas.height = 500;
    ctx.beginPath();

    var width_ctx = 500;
    var height_ctx = 500;
    var width_tiles = json_data.length;
    var width_cell = width_ctx/width_tiles;
    var height_tiles = json_data[0].length;



    for (var i = 0; i < json_data.length; i++) {
        for (var j = 0; j < json_data[0].length; j++) {

            if (json_data[j][i]) {
                ctx.fillRect(width_cell * i, width_cell * j, width_cell, width_cell)


                ctx.lineWidth = 6;
                ctx.strokeStyle = 'white';
                ctx.strokeRect(width_cell * i, width_cell * j, width_cell, width_cell)
            }

        }
    }



    for (var i = 0; i <= width_tiles; i++) {
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        var draw_x = width_cell * i
        ctx.moveTo(draw_x, 0);
        ctx.lineTo(width_cell * i, height_ctx);
        ctx.stroke();

        ctx.moveTo(0, draw_x);
        ctx.lineTo(width_ctx, width_cell * i);
        ctx.stroke();
    }






};




// Create WebSocket
//socket = new WebSocket("ws://www.example.com/socketserver")

