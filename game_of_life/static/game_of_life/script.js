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

    $grid.on('mousedown touchstart', function(ev) {

        console.log('jQuery Events');
        console.log(ev);


    })

    $grid.on('mousemove touchmove', function(ev) {

        //console.log('moving jQuery Events');
        //console.log(ev);


    })


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



    var grid = document.getElementById('grid');
    var hammerGrid = new Hammer(grid, {
        preventDefault: true
    });

    hammerGrid.get('pan').set({
        direction: Hammer.DIRECTION_ALL
    });



    hammerGrid.on('panstart', function(ev) {

        console.log('start');
        console.log(ev);
        hammerGrid.startX = ev.srcEvent.layerX;
        hammerGrid.startY = ev.srcEvent.layerY;

    })

    var isScrolling = false;
    $(window).scroll(function() {
        isScrolling = true;
    })

    hammerGrid.on('pan', function(ev){

        console.log(ev);

//        startX = ev.srcEvent.layerX
//        startY = ev.srcEvent.layerY

        if(isScrolling) {
            console.log('scrolling happened');
            hammerGrid.startX = ev.srcEvent.layerX;
            hammerGrid.startY = ev.srcEvent.layerY;
            isScrolling = false;
            console.log('new x and y: ' + [hammerGrid.startX , hammerGrid.startY]);
            //hammerGrid.
        }

        var newX = hammerGrid.startX + ev.deltaX;
        var newY = hammerGrid.startY + ev.deltaY;

        console.log(this);


        var rowCol = simulation.getRowCol(newX, newY);

        simulation.toggleCell(rowCol.row, rowCol.col, true);

        // Color this square


        // Get x and y

        // Compute row and col

    })


    // Create HammerJS instances
    var patterns = document.getElementsByClassName('pattern-overlay');
    var $patterns = $(patterns);
    console.log(patterns);
    var hammerPatterns = [];
    for (var i = 0; i < patterns.length; i++) {

        var hammerPattern = new Hammer(patterns[i]);

        hammerPattern.get('pan').set({
            direction: Hammer.DIRECTION_ALL
        });

        hammerPattern.on('panstart', function(ev) {

            if (!$(ev.target).is($patterns)) {
                console.log('hell yeah!')
                return;
            }

            console.log('this');
            console.log(this);

            var $pattern = $(ev.target);
            var $patternWrapper = $(ev.target.parentElement);

            $patternWrapper.removeClass('slow-transition');

            var $gridOffsetTop = $grid.offset().top

            $('body').animate({
                scrollTop: $gridOffsetTop - 50
            }, 500)

            console.log($pattern);
            //var $dragImg = $pattern.clone();
            //$dragImg.appendTo($('#pattern-block')[0].parentNode);
            //console.log($dragImg);

        });


        hammerPattern.on('pan', function(ev) {

            var $pattern = $(ev.target);

            var $patternWrapper = $(ev.target.parentElement);


            //var $dragImg

            $pattern.addClass('dragging');

            console.log('ev')
            console.log(ev);
            console.log("ev.target")
            console.log(ev.target);


            dx = ev.srcEvent.pageX - ev.target.x;
            dy = ev.srcEvent.pageY - ev.target.y;


            var translation = 'translate(' + dx + 'px ,' + dy + 'px)'

            $patternWrapper.css('transform', translation);

            //$dragImg.css('transform', translation);
            //console.log($dragImg);
            console.log(translation);


            // Check the pattern is within bounds of board
            var gridEdges = Edges($grid);
            var patternEdges = Edges($patternWrapper);


            if (patternEdges.inBounds(gridEdges)) {

                console.log('inBounds');
                $pattern.addClass('in-bounds');
                $patternWrapper.addClass('in-bounds');

            } else {
                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }


        })

        hammerPattern.on('panend', function(ev) {

            var $pattern = $(ev.target);
            var $patternWrapper = $(ev.target.parentElement);

            //var patternName
            var patternName = ev.target.id.split('-')[1];

            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);

            // Compute the x, y within grid
            if (patternEdges.inBounds(gridEdges)) {


                // Remove styling, fade element and return it
                $patternWrapper.fadeOut(500, function() {
                    $pattern.removeClass('dragging  in-bounds');
                    $patternWrapper.removeClass('in-bounds').css('transform', 'none').show();

                });

                // Put element back



                // Compute row and column of pattern in grid
                var y = gridEdges.top - patternEdges.top;
                var x = gridEdges.left - patternEdges.left;

                x = Math.abs(x);
                y = Math.abs(y);

                simulation.dropPattern(x, y, patternName);


                console.log("Panend");
                console.log([x, y]);

                // Compute corresponding x,y within grid matrix
            }
            // If pan ends and pattern is not within bounds
            else {

                //var $gridOffsetTop = $grid.offset().top
                console.log('not in bounds');

                var translation = 'translate(0px, 0px)';

                console.log($patternWrapper)

                $patternWrapper.addClass('slow-transition');

                $patternWrapper.css('transform', translation);

                $pattern.removeClass('dragging in-bounds');
                $patternWrapper.removeClass('in-bounds');

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

    obj.gridCols = Math.floor(ctx.canvas.width / obj.cellSide);
    obj.gridRows = Math.floor(ctx.canvas.height / obj.cellSide);

    obj.cellWidth = ctx.canvas.width / obj.gridCols;
    obj.cellHeight = ctx.canvas.height / obj.gridRows;


    // Define methods
    obj.drawRowsCols = drawRowsCols;
    obj.drawGrid = drawGrid;
    obj.clearCanvas = clearCanvas;
    obj.startSimulation = startSimulation;
    obj.dropPattern = dropPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;

    return obj;


}


//*************************************************//
// Instance method belong to the Simulation class
// Initiates simulation
//*************************************************//

var startSimulation = function() {

    // Initiate Simulation on server-size


    // Draw grid
    this.drawRowsCols();


    // Send data to websocket
    message_data =  {
        'cols':  this.gridCols,
        'rows': this.gridRows,
        'initiate': true,
    }

    socket.send(JSON.stringify(message_data));

}


var getRowCol = function(x, y) {
    row = Math.floor(y / this.cellWidth);
    col = Math.floor(x / this.cellHeight);

    return { row: row, col: col };
}

//*************************************************//
// Instance method belong to the Simulation class
// Drops pattern on simulation
//*************************************************//

var dropPattern = function(x, y, pattern) {



    var coord = this.getRowCol(x, y);


    // Compute x and y of pattern


    // Send pattern to websocket
    message_data =  {
        row: coord.row,
        col: coord.col,
        pattern: pattern,
        command: 'dropPattern'
    }

    socket.send(JSON.stringify(message_data));
    console.log([row, col]);


}


//*************************************************//
// Instance method belonging to the Simulation class
// Draw grid
//*************************************************//
var drawRowsCols = function() {

    // First draw columns lines
    for (var i = 0; i <= this.gridCols; i++) {

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

    // Then draw row lines
    for (var i = 0; i <= this.gridRows; i++) {

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

    // Draw the grid (row, col)
    for (var row = 0; row < this.gridRows; row++) {
        for (var col = 0; col < this.gridCols; col++) {
            //console.log('(row, col) -->' + [row, col])
            if (this.grid[row][col]) {
                // fillRect(x, y, width, height)
                this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
            }

        }
    }

    this.drawRowsCols();
}

//*************************************************//
// Instance method belonging to the Simulation class
// Clear canvas
//*************************************************//
var clearCanvas = function() {

    self.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}





var toggleCell = function(row, col, turnOn) {

    if (turnOn) {
        this.ctx.fillStyle = "#06D6A0";
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
        this.ctx.strokeRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    } else {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    }


}