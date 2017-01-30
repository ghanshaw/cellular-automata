//*************************************************//
// Class to implement the Simulation
//*************************************************//
var Simulation = function() {



    var obj = {};






    /* Some arbitrary constant that determines the approx. length of cell side */
    /* Should change based on the size of the screen */




    obj.simSpeed = 'slow';
    obj.predictions = [];

    obj.isRunning = false;
    obj.isPredicting = false;
    obj.isFrozen = false;


    obj.pop = 0;
    obj.year = 0;

    obj.dashboard = dashboard;


    // Drawing methods
    obj.drawRowsCols = drawRowsCols;
    obj.drawGrid = drawGrid;
    obj.eraseCanvas = eraseCanvas;

    // Simulation controls
    obj.startSimulation = startSimulation;
    obj.stepSimulation = stepSimulation;
    obj.runSimulation = runSimulation;
    obj.stopSimulation = stopSimulation;
    obj.clearSimulation = clearSimulation;

    obj.outgoingNum = 0;
    obj.incomingNum = 0;

    obj.randomizeSimulation = randomizeSimulation


    obj.addPattern = addPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;
    obj.activateCells = activateCells;

    obj.isPaused = false;
    obj.isAltering = false;


    obj.bindConsoleButtons = bindConsoleButtons;

    obj.addPredictions = addPredictions;
    obj.createWebSocket = createWebSocket;
    obj.sendData = sendData
    obj.freezeConsole = freezeConsole;
    obj.thawConsole = thawConsole;
    obj.updateConsole = updateConsole;

    obj.chooseGeneration = chooseGeneration;

    obj.maxYear = 0;
    obj.gridDimensions = gridDimensions;
    obj.onResize = onResize;


    // --- D3 methods and variables
    obj.initDashboard = initDashboard;
    obj.genTimeline  = [];
    obj.recordHistory = recordHistory;
    obj.eraseHistory = eraseHistory;

    obj.clearFuture = clearFuture;

    obj.predictionRefresh = 15;

    obj.simSpeeds = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    }

    return obj;

}


var restartConnection  = function() {

    // Freeze simulation

    this.socket = createWebSocket();

    // Proceed when WebSocket finishes opening
    this.socket.addEventListener('open', function(event){

        // Send data to websocket
        message_data =  {
            'cols':  sim.gridCols,
            'rows': sim.gridRows,
            'serverCommand': 'resumeGrid',
            'clientCommand': 'drawGrid'
        }

        sim.sendData(message_data);

    })

}


//*************************************************//
// Create WebSocket
//*************************************************//
var createWebSocket = function() {

    socket = new WebSocket("ws://" + window.location.host + '/game-of-life');

    socket.onopen = function() {};

    socket.onclose = function() {

        simulation.restartConnection();

    };


    socket.onmessage = function(e) {


        onmessage_time = new Date();
        console.log('WebSocket Time: ' + (onmessage_time - send_time) + 'ms');

        parseStart = new Date();
        var message = $.parseJSON(e.data);
        parseEnd = new Date();

        console.log('Parsed Time: ' + (parseEnd - parseStart) + 'ms');
        //draw();

        simulation.incomingNum = message.order;
        console.log('Incoming Num: ' + simulation.incomingNum)

        if (simulation.incomingNum < simulation.outgoingNum) {
            alert('Out of order!');
            return;
        }

        simulation.genTimeline = message.genTimeline;

        if (message.content == 'predictions') {

            // Load predictions from socket into simulation
            simulation.addPredictions(message.predictions);

            // Indicate that client is done retrieving predictions
            simulation.isPredicting = false;

        }

        if (message.clientCommand == 'drawGrid') {

            // Retrieve next prediction
            var generation = simulation.predictions.pop();
            simulation.grid = generation['grid'];
            simulation.pop = generation['pop'];
            simulation.year = generation['year'];


            // Draw grid
            simulation.drawGrid();

            // Update statistics
            simulation.updateConsole()
        }

        if (simulation.isFrozen) {
            simulation.thawConsole();
        }

        if (!simulation.isAltering) {
            simulation.isPaused = false;
        }

     }

     return socket;


}



var recordHistory = function() {

    simulation.genTimeline.push({
        year: this.year,
        pop: this.pop
    })

}

var eraseHistory = function() {

    simulation.genTimeline = [];

    simulation.maxYear = 0;
}


//*************************************************//
// Enqueue predictions to prediction queue
//*************************************************//
var addPredictions = function(predictions) {

    for (var i = 0; i < predictions.length; i++) {

        this.predictions.unshift(predictions[i])

    }

}


//*************************************************//
// Bind all the console buttons
//*************************************************//
var bindConsoleButtons = function() {

     /*
     Create draggabilly buttons for each console button
     Use draggabilly to exploit 'is-pointing' class,
     ensure consistent behavior on mobile and desktop and
     avoid use of ':active' psuedo-class
     */


    // Create draggabilly step button
    $btnStep = $('#button-step').draggabilly({});
    $btnStep.draggabilly('disable');

    $btnStep.on('staticClick', function() {

        simulation.stepSimulation();

    })

    // Create draggabilly run button
    $btnRun = $('#button-run').draggabilly({});
    $btnRun.draggabilly('disable');

    $btnRun.on('staticClick', function() {

        $this = $(this)

        // If button is not switched on
        if (!$this.hasClass('switched-on') && simulation.pop > 0) {

            // Style button
            $this.addClass('switched-on');
            $this.text('Stop');

            // Add console-freezable class
            $this.removeClass('console-freezable');

            // Run simulation
            simulation.runSimulation();

        }
        // If button is switched on
        else {

            // Style button
            $this.removeClass('switched-on');
            $this.text('Run');

            // Add console-freezable class
            $this.addClass('console-freezable');

            simulation.stopSimulation();

            // Stop simulation
            // If simulation is running
            if (simulation.isRunning) {
                alert("Simulation isn't running");
            }

        }

    })


    // Create draggabilly random button
    $btnRandom = $('#button-random').draggabilly({});
    $btnRandom.draggabilly('disable');

    $btnRandom.on('staticClick', function() {

         simulation.randomizeSimulation()

    })

    // Create draggabilly clear button
    $btnClear = $('#button-clear').draggabilly({});
    $btnClear.draggabilly('disable');

    $btnClear.on('staticClick', function() {

        // Style run button
        $('#button-run').removeClass('switched-on');
        $('#button-run').addClass('console-freezable');
        $('#button-run').text('Run');


        // Clear simulation
        simulation.clearSimulation();


    })


    // Create draggabilly speed buttons
    speedButtons = document.getElementsByClassName('btn-speed');
    $btnSpeedArray = [];

    for (var i = 0; i < speedButtons.length; i++) {

        // Initialize a speed button
        $btnSpeed = $('.btn-speed').draggabilly({});
        $btnSpeed.draggabilly('disable');

        // Add static click behavior
        $btnSpeed.on('staticClick', function(event) {

            $this = $(this)
            console.log($this)

            // If button isn't switched on
            if (!$this.hasClass('switched-on')) {

                // Style buttons
                $('.btn-speed').removeClass('switched-on');
                $this.addClass('switched-on');

                // Update the simulation speed
                simulation.simSpeed = this.id.split('-')[1];

                // If simulation is running
                if (simulation.isRunning) {

                    // Restart simulation
                    simulation.stopSimulation();
                    simulation.runSimulation();
                }

            }

        });

        // Append array of speed buttons
        $btnSpeedArray.push($btnSpeed);

    }

}


//*************************************************//
// One method of sending all data to server through WS
//*************************************************//
var sendData = function(message_data) {

    send_time = new Date();

    simulation.outgoingNum += 1;
    console.log('Outgoing Num: ' + simulation.outgoingNum);
    this.socket.send(JSON.stringify(message_data));

}


/*--------------------------------------------------------*/
// Simulation Controls
/*--------------------------------------------------------*/


//*************************************************//
// Initiates simulation
//*************************************************//
 var startSimulation = function() {

    // Freeze console while loading
    this.freezeConsole();

    // Bind console buttons
    this.bindConsoleButtons();

    // Add resize event listener
    this.onResize();

    // Create WebSocket
    this.socket = createWebSocket();

    // Create grid dimensions
    this.gridDimensions();

    // Create canvas background
    this.background = this.drawRowsCols();

    // Select initial server speed
    $('#button-' + this.simSpeed).addClass('switched-on');

    var sim = this;

    // Proceed when WebSocket finishes opening
    this.socket.addEventListener('open', function(event){

        // Send data to websocket
        message_data =  {
            'cols':  sim.gridCols,
            'rows': sim.gridRows,
            'serverCommand': 'initGrid',
            'clientCommand': 'drawGrid'
        }

        sim.sendData(message_data);

    })

}


//*************************************************//
// Update canvas one generation
//*************************************************//
var stepSimulation = function() {

    var step_start = new Date()

    // If simulation is running, do nothing
    //if (this.isRunning) { return; }

    // If simulation is paused, do nothing
    if (this.isPaused) { return; }

    // If grid is empty, do nothing
    if (this.pop == 0) { return; }

    // If no predictions are available, wait for new ones to come from server
    else if (this.predictions.length == 0) {
        this.isPaused = true;
        this.freezeConsole();
        //this.runSimulation();
        return;
    }

    // Retrieve next generation from prediction
    var generation = this.predictions.pop()
    this.grid = generation['grid'];
    this.pop = generation['pop'];
    this.year = generation['year'];

    // Draw grid
    this.drawGrid();

    // Record history
    //this.recordHistory();

    // Update statistics
    this.updateConsole()

    // If prediction buffer is too low, add predictions
    if (this.predictions.length <= this.predictionRefresh && !this.isPredicting) {

        console.log('Get predictions!');

        // Indicate that client is retrieving more predictions
        this.isPredicting = true;

        // Get last year currently in prediction queue
        var lastYear = this.predictions[0].year;

        // Send data to WebSocket
        message_data =  {
            'serverCommand': 'getPredictions',
            'clientCommand': '',
            year: lastYear + 1
        }

        this.sendData(message_data);

    }

    console.log('Prediction Buffer Size: ' + this.predictions.length);
    var step_end = new Date()
    console.log('Step Time: ' + (step_end - step_start) + 'ms');

}


//*************************************************//
// Update simulation at regular intervals
//*************************************************//
var runSimulation = function() {

    this.isRunning = true;

    that = this;

    var interval = this.simSpeeds[this.simSpeed];
    this.simInterval = setInterval(function() {

        return that.stepSimulation();

    }, interval);

}


//*************************************************//
// Stop/pause simulation
//*************************************************//
var stopSimulation = function() {

    clearInterval(this.simInterval)
    this.isRunning = false;
}


//*************************************************//
// Clear simulation canvas
//*************************************************//
var clearSimulation = function() {

    // If simulation is running, stop
    if (this.isRunning) {
        this.stopSimulation();
    }

    // Clear predictions
    this.predictions = [];

    // Erase history
    this.eraseHistory();

    // Freeze console
    this.freezeConsole();


    message_data =  {
        'serverCommand': 'clear',
        'clientCommand': 'drawGrid',
    }

    this.sendData(message_data);
}


//*************************************************//
// Randomize simulation canvas
//*************************************************//
var randomizeSimulation = function() {

    // If simulation is running, stop
    if (this.isRunning) {
        this.isPaused = true;
    }

    // Clear future
    this.clearFuture();

    // Freeze console
    this.freezeConsole();

    message_data =  {
        'serverCommand': 'randomize',
        'clientCommand': 'drawGrid',
        'year': this.year
    }

    this.sendData(message_data);
}

var clearFuture = function() {

    // Clear predictions
    this.predictions = [];

    // Reset maxYear
    this.maxYear = this.year;


}


/*--------------------------------------------------------*/
// Drawing Methods
/*--------------------------------------------------------*/


//*************************************************//
// Draw rows and col of simulation on canavas
//*************************************************//
var drawRowsCols = function() {

    var rc_canvas = document.createElement('canvas');
    rc_canvas.width = this.ctxWidth;
    rc_canvas.height = this.ctxHeight;
    var rc_ctx = rc_canvas.getContext('2d');


    //rc_ctx.strokeStyle = '#ddd';
    rc_ctx.strokeStyle = '#0af1b5';
    rc_ctx.lineWidth = 1;

    // First draw columns lines
    for (var i = 0; i <= this.gridCols; i++) {

        var xPos = this.cellWidth * i;

        rc_ctx.moveTo(xPos, 0);
        rc_ctx.lineTo(xPos, rc_canvas.height);

    }

    // Then draw row lines
    for (var i = 0; i <= this.gridRows; i++) {

        var yPos = this.cellHeight * i;

        rc_ctx.moveTo(0, yPos);
        rc_ctx.lineTo(rc_canvas.width, yPos);

    }

    rc_ctx.stroke();

    return rc_canvas;

}


//*************************************************//
// Draw grid (active cells, rows and cols) of simulation
// on canvas
//*************************************************//
var drawGrid = function() {

    var drawStart = performance.now();

    // Clear canvas
    this.eraseCanvas();

    // Carribean Green
    //this.ctx.fillStyle = "#06D6A0";

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

    this.ctx.drawImage(this.background, 0, 0);

    var drawEnd = performance.now();
    console.log('Draw Time: ' + (drawEnd - drawStart) + 'ms')
}


//*************************************************//
// Clear simulation canvas
//*************************************************//
var eraseCanvas = function() {

    self.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}


//*************************************************//
// Make cells highlighted by user active
//*************************************************//
var activateCells = function(newCells) {

    // Clear future
    this.clearFuture();

    // Freeze console
    this.freezeConsole();

    message_data =  {
        serverCommand: 'activateCells',
        clientCommand: 'drawGrid',
        newCells: newCells,
        year: this.year
    }

    this.sendData(message_data);

}


var updateConsole = function() {

    $('#console-pop').text(this.pop);
    $('#console-gen').text(this.year);

    // Update max year
    this.maxYear = Math.max(this.year, this.maxYear);

    dashboard.drawDashboard();

}




//*************************************************//
// Toggle dead/alive status of individual cell on canvas
//*************************************************//
var toggleCell = function(row, col, turnOn) {

    if (turnOn) {
        //this.ctx.fillStyle = "#06D6A0";
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
        this.ctx.strokeRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    } else {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    }


}




//*************************************************//
// Computes row and col with x, y coordinates
// (from top, left origin)
//*************************************************//
var getRowCol = function(x, y) {

    row = Math.floor(y / this.cellWidth);
    col = Math.floor(x / this.cellHeight);

    return { row: row, col: col };

}


//*************************************************//
// Add chosen pattern to simulation canvas
//*************************************************//
var addPattern = function(x, y, pattern) {

    console.log('Add pattern!');

    // Clear future
    this.clearFuture();

    // Await predictions
    this.freezeConsole()

    // Compute coordinates of placed pattern
    var coord = this.getRowCol(x, y);

    // Send pattern to websocket
    message_data =  {
        row: coord.row,
        col: coord.col,
        pattern: pattern,
        year: this.year,
        serverCommand: 'addPattern',
        clientCommand: 'drawGrid'
    }

    this.sendData(message_data);

}


//*************************************************//
// Load wait screen, disable button, while awaiting predictions
//*************************************************//
var freezeConsole = function() {

    // Indicate that simulation is frozen
    this.isFrozen = true;

    // Show loading screen
    $('.loader-wrapper').css('display', 'flex');

    // Freeze buttons
    $('.console-freezable').addClass('frozen');

    // Store 'this' (to pass to setInterval)
    //var that = this;

    // Create a setInterval that run while predictions are being generated
    this.freezeInterval = setInterval(function() { return; }, 20);

}


var thawConsole = function() {

    // Deactivate setInterval
    clearInterval(this.freezeInterval);

    // Hide loader
    $('.loader-wrapper').css('display', 'none');

    // Freeze buttons
    $('.console-freezable').removeClass('frozen');

    // Indicate that simulation is not frozen
    this.isFrozen = false;

}




var chooseGeneration = function(year) {

    // Empty out predictions
    this.predictions = [];

    // Freeze console
    this.freezeConsole()


    message_data =  {
        serverCommand: 'getPredictions',
        clientCommand: 'drawGrid',
        year: year
    }

    this.sendData(message_data);

}


var onResize = function() {

    that = this;

    $(window).on("resize", function() {

        // Update grid dimensions
        that.gridDimensions();

        // Redraw background
        that.ctx.background = that.drawRowsCols();

        // Redraw grid
        that.drawGrid();

    })
}

var gridDimensions = function() {

    var canvas = document.getElementById("grid");

    this.ctx = ctx = canvas.getContext("2d");

    this.ctx.beginPath();


    this.cellSide = 12;

    this.ctxWidth = ctx.canvas.width = $(canvas).width();
    this.ctxHeight = ctx.canvas.height = $(canvas).height();

    this.ctx.fillStyle = "#06D6A0";
    this.ctx.strokeStyle = "#0af1b5";

    this.gridCols = Math.floor(ctx.canvas.width / this.cellSide);
    this.gridRows = Math.floor(ctx.canvas.height / this.cellSide);

    this.cellWidth = ctx.canvas.width / this.gridCols;
    this.cellHeight = ctx.canvas.height / this.gridRows;

}