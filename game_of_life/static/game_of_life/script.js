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
    simulation = Simulation();

    socket.onopen = function() {

        simulation.startSimulation();

    }


     socket.onmessage = function(e) {

        message_time = new Date();
        //console.log(e);
        console.log('Total time: ' + (message_time - updateEnter) + 'ms');
        //console.log(e.data);

        parseStart = new Date();
        socket.proceed = $.parseJSON(e.data)['proceed'];
        socket.grid = $.parseJSON(e.data)['grid'];
        parseEnd = new Date();

        console.log('Parsed Date: ' + (parseEnd - parseStart) + 'ms');
        //draw();

        if (socket.proceed) {
            simulation.grid = socket.grid;
            simulation.drawGrid();
        }



    }


    var consoleButtons = document.getElementsByClassName('btn-console');

    var $draggieConsoleButtons = [];

    for (var i =0; i < consoleButtons.length; i++) {

        var $draggieConsoleButton = $(consoleButtons[i]).draggabilly({});
        $draggieConsoleButton.draggabilly('disable');

        // If console button is speed button, add additional event listeners
        if ($draggieConsoleButton.hasClass('btn-speed')) {

            // Add additional static click event to speed buttons
            $draggieConsoleButton.on('staticClick', function(event, pointer) {

                $speedButton = $(event.target);

                // If the speed button is inactive, then
                // remove styling from other buttons and
                // add styling to that button
                if (!$speedButton.hasClass('switched-on')) {

                    $('.btn-speed').removeClass('switched-on');
                    $speedButton.addClass('switched-on');

                }
            })

        }


        // If console button is run button, add additional even listener
        if ($draggieConsoleButton.hasClass('btn-run')) {

            $draggieConsoleButton.on('staticClick', function(event, pointer) {

                $runButton = $(event.target);

                if ($runButton.hasClass('switched-on')) {
                    $runButton.removeClass('switched-on');
                    $runButton.text('Run');
                } else {
                    $runButton.addClass('switched-on');
                    $runButton.text('Stop');
                }


            });
        }

        $draggieConsoleButtons.push($draggieConsoleButton);
    }


    var $draggieGrid = $('#grid').draggabilly({});
    $draggieGrid.draggabilly('disable');

    $draggieGrid.newCells = [];
    $draggieGrid.setCells = new Set();


    var grid = document.getElementById('grid');

    $draggieGrid.on('pointerMove', function(event, pointer) {



        console.log(event);
        console.log(pointer);

        gridEdges = Edges($grid);
        gridX = pointer.pageX - gridEdges.left;
        gridY = pointer.pageY - gridEdges.top;

        console.log(gridX, gridY);

        var rowCol = simulation.getRowCol(gridX, gridY);

        var cellId = parseFloat(rowCol.row + '.' + rowCol.col);
        console.log(cellId);

        if (!$draggieGrid.setCells.has(cellId)) {
            $draggieGrid.newCells.push(rowCol);
            $draggieGrid.setCells.add(cellId);
        }

        simulation.toggleCell(rowCol.row, rowCol.col, true);


    });

    $draggieGrid.on('pointerUp', function(event, pointer) {


        simulation.activateCells($draggieGrid.newCells);
        $draggieGrid.setCells.clear();
        $draggieGrid.newCells = [];

    })


    var patterns = document.getElementsByClassName('pattern-wrapper');
    //var $patterns = $('.pattern-overlay');

    var $draggiePatterns = [];

    for (var i = 0; i < patterns.length; i++) {

        var $draggiePattern = $(patterns[i]).draggabilly();

        $draggiePattern.on('dragStart', function(event, pointer) {

            //var $patternWrapper = $(ev.target.parentElement);

            var $gridOffsetTop = $grid.offset().top

            $('body').animate({
                scrollTop: $gridOffsetTop - 50
            }, 500)



            var draggieData = $draggiePattern.data('draggabilly');
            //console.log(draggieData);

            // Check the pattern is within bounds of board

        })

        $draggiePattern.on('dragMove', function(event, pointer){

            var $pattern = $(event.currentTarget).find('img');
            var $patternWrapper = $(event.currentTarget);

            var gridEdges = Edges($grid);
            var patternEdges = Edges($patternWrapper);

            console.log(event.currentTarget);
            console.log(pointer);
            console.log(patternEdges);
            console.log(gridEdges);


            if (patternEdges.inBounds(gridEdges)) {

                console.log('inBounds');
                $pattern.addClass('in-bounds');
                $patternWrapper.addClass('in-bounds');

            } else {
                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })

        $draggiePattern.on('dragEnd', function(event, pointer) {

            var $pattern = $(event.currentTarget).find('img');
            var $patternWrapper = $(event.currentTarget);

            //var patternName
            var patternName = event.target.id.split('-')[1];

            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);

            // Compute the x, y within grid
            if (patternEdges.inBounds(gridEdges)) {


                // Remove styling, fade element and return it
                $patternWrapper.fadeOut(500, function() {
                    $pattern.removeClass('in-bounds');
                    $patternWrapper.removeClass('in-bounds').css({ 'left': 0, 'top': 0 }).show();

                });

                // Put element back



                // Compute row and column of pattern in grid
                var y = gridEdges.top - patternEdges.top;
                var x = gridEdges.left - patternEdges.left;

                x = Math.abs(x);
                y = Math.abs(y);

                console.log(patternName);

                simulation.addPattern(x, y, patternName);


                console.log("Panend");
                console.log([x, y]);

                // Compute corresponding x,y within grid matrix
            }
            // If pan ends and pattern is not within bounds
            else {

                //var $gridOffsetTop = $grid.offset().top
                console.log('not in bounds');


                $patternWrapper.animate({

                    left: 0,
                    top: 0,

                }, 500);

                var translation = 'translate(0px, 0px)';

                console.log($patternWrapper)

                //$patternWrapper.addClass('slow-transition');

                //$patternWrapper.css('transform', translation);

                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })


        $draggiePatterns.push($draggiePattern);

    }



    //json_data = document.getElementById('json').innerText
    //createSocket()

    //json_data = $.parseJSON(json_data)

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
    obj.cellSide = 10;

    obj.gridCols = Math.floor(ctx.canvas.width / obj.cellSide);
    obj.gridRows = Math.floor(ctx.canvas.height / obj.cellSide);

    obj.cellWidth = ctx.canvas.width / obj.gridCols;
    obj.cellHeight = ctx.canvas.height / obj.gridRows;

    obj.simSpeed = 'slow';


    // Define methods
    obj.drawRowsCols = drawRowsCols;
    obj.drawGrid = drawGrid;
    obj.clearCanvas = clearCanvas;
    obj.startSimulation = startSimulation;
    obj.addPattern = addPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;
    obj.activateCells = activateCells;
    obj.updateSimulation = updateSimulation;
    obj.runSimulation = runSimulation;
    obj.stopSimulation = stopSimulation;
    obj.bindConsoleButtons = bindConsoleButtons;

    obj.simIntervals = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    }

    return obj;

}

var bindConsoleButtons = function() {


    $('#button-step').click(function() {

        simulation.updateSimulation();

    })

    $('#button-run').click(function() {

        if ($(this).hasClass('switched-on')) {
            simulation.runSimulation();
        } else {
            simulation.stopSimulation();
        }

    })

    $('.btn-speed').click(function(event) {

        // Update the simulation speed
        simulation.stopSimulation();
        simulation.simSpeed = event.target.id.split[1];

        if ($(this).hasClass('switched-on')) {
            simulation.runSimulation();
        }

    })


    $('#button-random').click(function() {

        message_data = { 'command': 'random' };
        socket.send(JSON.stringify(message_data));

    })


    $('#button-clear').click(function() {

        message_data = { 'command': 'clear' };
        socket.send(JSON.stringify(message_data));


    })
}



//*************************************************//
// Instance method belong to the Simulation class
// Initiates simulation
//*************************************************//

var startSimulation = function() {

    this.bindConsoleButtons();

    // Initiate Simulation on server-size
    $('#button-' + this.simSpeed).addClass('switched-on');

    // Draw grid
    this.drawRowsCols();


    // Send data to websocket
    message_data =  {
        'cols':  this.gridCols,
        'rows': this.gridRows,
        'command': 'createGrid'
    }

    updateEnter = new Date();
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

var addPattern = function(x, y, pattern) {

    var coord = this.getRowCol(x, y);


    // Compute x and y of pattern


    // Send pattern to websocket
    message_data =  {
        row: coord.row,
        col: coord.col,
        pattern: pattern,
        command: 'addPattern',
    }

    console.log('message_data');
    socket.send(JSON.stringify(message_data));
    console.log([row, col]);


}

var updateSimulation = function() {

    updateEnter = new Date();
    message_data = { 'command': 'step' };
    socket.send(JSON.stringify(message_data));

}

var runSimulation = function() {

    var interval = this.simIntervals[this.simSpeed];
    this.simInterval = setInterval(updateSimulation, 500);

}

var stopSimulation = function() {

    clearInterval(this.simInterval)

}

//*************************************************//
// Instance method belong to the Simulation class
// Drops pattern on simulation
//*************************************************//
var activateCells = function(newCells) {

    console.log(newCells);
    console.log(newCells.length);

    //newCells = JSON.stringify(newCells);

    //console.log(json);

       message_data =  {
        newCells: newCells,
        command: 'activateCells',
    }

     socket.send(JSON.stringify(message_data));

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

    var drawStart = new Date();

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

    var drawEnd = new Date();
    console.log('Draw Time: ' + (drawEnd - drawStart) + 'ms')
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