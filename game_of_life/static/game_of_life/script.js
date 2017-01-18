//*************************************************//
// Function to apply Slideout menu
//*************************************************//

// Creates the Slideout Menu
function applySlideoutMenu() {

    // Create Slideout Element
    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'padding': 256,
        'tolerance': 70
    });

    // Toggle slideout button
    document.querySelector('.toggle-button').addEventListener('click', function() {
        slideout.toggle();
        $(this).toggleClass('is-active');
    });

}


//*************************************************//
// Class to track edges of a DOM element
//*************************************************//

// Edges Class stores the edges of an element
var Edges = function(element) {
    var $element = $(element);

    var top = $element.offset().top;
    var left = $element.offset().left;
    var right = left + $element.width();
    var bottom = top + $element.height();

    var edges = {
        top: top,
        left: left,
        right: right,
        bottom: bottom
    }

    // inBound method evaluates whether element a is within the bounds of element b
    // ex: a.inBound(edgesB) returns true if a is within b
    edges.inBounds = function(outer) {

        return top > outer.top && left > outer.left && right < outer.right && bottom < outer.bottom;

    }

    return edges;
}



var json_data;


$(document).ready(function() {

    $grid = $('#grid');


    // Create menu
    applySlideoutMenu();

    // Create WebSocket connection
    var socket = ServerConnect();

    // Create simulation
    var simulation = Simulation();

    socket.onopen = function() {

        simulation.startSimulation();

    }


     socket.onmessage = function(e) {

        //console.log(e.data);
        socket.proceed = $.parseJSON(e.data)['proceed'];
        socket.grid = $.parseJSON(e.data)['grid'];
        //draw();

        if (socket.proceed) {
            simulation.grid = socket.grid;
            simulation.drawGrid();
        }

    }




    // Create HammerJS instances
    var patterns = document.getElementsByClassName('pattern');
    var hammerPatterns = [];
    for (var i = 0; i < patterns.length; i++) {

        var hammerPattern = new Hammer(patterns[i]);

        hammerPattern.get('pan').set({
            direction: Hammer.DIRECTION_ALL
        });

        hammerPattern.on('panstart', function(ev) {

            $boardOffsetTop = $grid.offset().top

            $('body').animate({
                scrollTop: $boardOffsetTop - 50
            }, 500)


        });


        hammerPattern.on('pan', function(ev) {

            var $pattern = $(ev.target);

            dx = ev.srcEvent.pageX - ev.target.x;
            dy = ev.srcEvent.pageY - ev.target.y;

            translation = 'translate(' + dx + 'px ,' + dy + 'px)'

            ev.target.style.transform = translation;
            console.log(translation);




            // Check the pattern is within bounds of board
            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);


            if (patternEdges.inBounds(gridEdges)) {

                console.log('inBounds');
                $pattern.css('border', '2px solid yellow');

            } else {

                $pattern.css('border', 'none');

            }


        })

        hammerPattern.on('panend', function(ev) {

            var $pattern = $(ev.target);

            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);

            // Compute the x, y within grid
            if (patternEdges.inBounds(gridEdges)) {

                y = gridEdges.top - patternEdges.top;
                x = gridEdges.left - patternEdges.left;

                x = Math.abs(x);
                y = Math.abs(y);

                simulation.dropPattern(x, y, $pattern);


                console.log("Panend");
                console.log([x, y]);

                // Compute corresponding x,y within grid matrix
            }

        })

        hammerPatterns.push(hammerPattern);

    }



    //json_data = document.getElementById('json').innerText
    //createSocket()

    //json_data = $.parseJSON(json_data)



    // Call onopen directly if socket is already open
    $('#button-step').click(function() {

        message_data = {
            'start': false,
            'step': true
        }
        socket.send(JSON.stringify(message_data));

    })


})


//*************************************************//
// Class to implement the WebSocket
//*************************************************//


var ServerConnect = function() {

    // Note that the path doesn't matter for routing; any WebSocket
    // connection gets bumped over to WebSocket consumers
    socket = new WebSocket("ws://" + window.location.host + '/game-of-life');

    console.log(socket)



    socket.onopen = function() {
        message_data = {
            'start': true,
            'step': true
        }
        socket.send(JSON.stringify(message_data));
        //simulation.startSimulation();
    }

    socket.isOpen = socket.readyState == WebSocket.OPEN;

    return socket;

}



//*************************************************//
// Class to implement the Simulation
//*************************************************//

var Simulation = function() {

    var canvas = document.getElementById("grid");

    var obj = {};

    obj.ctx = ctx = canvas.getContext("2d");
    obj.ctxWidth = ctx.canvas.width = $(canvas).width();
    obj.ctxHeight = ctx.canvas.height = $(canvas).height();


    // Infra red
    ctx.fillStyle = "#ef476f";

    // Orange-Yellow
    ctx.fillStyle = "#FFD166";

    // Carribean Green
    ctx.fillStyle = "#06D6A0";

    // Slategrey
    //ctx.fillStyle = "slategrey";


    ctx.beginPath();


    /* Some arbitrary constant that determines the approx. length of cell side */
    /* Should change based on the size of the screen */
    obj.cellSide = 13;

    obj.gridWidth = Math.floor(ctx.canvas.width / obj.cellSide);
    obj.gridHeight = Math.floor(ctx.canvas.height / obj.cellSide);

    obj.cellWidth = ctx.canvas.width / obj.gridWidth;
    obj.cellHeight = ctx.canvas.height / obj.gridHeight;


    // Define methods
    obj.drawCells = drawCells;
    obj.drawGrid = drawGrid;
    obj.clearCanvas = clearCanvas;
    obj.startSimulation = startSimulation;
    obj.dropPattern = dropPattern;

    return obj;


}


//*************************************************//
// Instance method belong to the Simulation class
// Initiates simulation
//*************************************************//

var startSimulation = function() {

    // Initiate Simulation on server-size


    // Draw grid
    this.drawCells();


    // Send data to websocket
    message_data =  {
        'gridWidth':  this.gridWidth,
        'gridHeight': this.gridHeight,
        'initiate': true,
    }

    socket.send(JSON.stringify(message_data));

}

//*************************************************//
// Instance method belong to the Simulation class
// Drops pattern on simulation
//*************************************************//

var dropPattern = function(x, y, pattern) {



    // Compute x and y of pattern
    row = Math.floor(x / this.cellWidth);
    col = Math.floor(y / this.cellHeight);

    // Send pattern to websocket
    message_data =  {
        //'pattern':
    }

    console.log([row, col]);


}


//*************************************************//
// Instance method belonging to the Simulation class
// Draw grid
//*************************************************//
var drawCells = function() {

    // First draw vertical lines
    for (var i = 0; i <= this.gridWidth; i++) {

        //ctx.strokeStyle = '#ADACB5';
        this.ctx.strokeStyle = '#ddd';
        //ctx.strokeStyle = 'blue';
        //ctx.strokeStyle = "#06D6A0";
        this.ctx.lineWidth = 1;

        var xPos = this.cellWidth * i;

        this.ctx.moveTo(xPos, 0);
        this.ctx.lineTo(xPos, this.ctx.canvas.height);

        this.ctx.stroke();

    }

    // Then draw horizontal lines
    for (var i = 0; i <= this.gridHeight; i++) {

        var yPos = this.cellHeight * i;

        this.ctx.moveTo(0, yPos);
        this.ctx.lineTo(this.ctx.canvas.width, yPos);

        this.ctx.stroke();

    }

}


//*************************************************//
// Instance method belonging to the Simulation class
// Draw grid
//*************************************************//
var drawGrid = function() {

    // Clear canvas
    this.clearCanvas();


    // Carribean Green
    this.ctx.fillStyle = "#06D6A0";

    // First draw vertical lines
    for (var i = 0; i <= this.gridWidth; i++) {
        for (var j = 0; j <= this.gridHeight; j++) {

            if (this.grid[j][i]) {
                self.ctx.fillRect(i * this.cellWidth, j * this.cellHeight, this.cellWidth, this.cellHeight);
            }

        }
    }

    this.drawCells();
}

//*************************************************//
// Instance method belonging to the Simulation class
// Clear canvas
//*************************************************//
var clearCanvas = function() {

    self.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}