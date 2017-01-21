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

    obj.cellWidth = Math.floor(ctx.canvas.width / obj.gridCols);
    obj.cellHeight = ctx.canvas.height / obj.gridRows;

    obj.simSpeed = 'slow';
    obj.predictions = [];
    obj.isRunning = false;
    obj.population = 100;
    obj.isPredicting = false;

    // Define methods
    obj.drawRowsCols = drawRowsCols;
    obj.drawGrid = drawGrid;
    obj.clearCanvas = clearCanvas;
    obj.clearGrid = clearGrid;
    obj.startSimulation = startSimulation;
    obj.addPattern = addPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;
    obj.activateCells = activateCells;
    obj.stepSimulation = stepSimulation;
    obj.runSimulation = runSimulation;
    obj.stopSimulation = stopSimulation;
    obj.bindConsoleButtons = bindConsoleButtons;

    obj.addPredictions = addPredictions;
    obj.createWebSocket = createWebSocket;
    obj.sendData = sendData
    obj.awaitPredictions = awaitPredictions;

    obj.predictionRefresh = 10;

    obj.simIntervals = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    }

    return obj;

}


//*************************************************//
// Create WebSocket
//*************************************************//
var createWebSocket = function() {

    socket = new WebSocket("ws://" + window.location.host + '/game-of-life');

    socket.onopen = function() {};


    socket.onmessage = function(e) {


        onmessage_time = new Date();
        console.log('WebSocket Time: ' + (onmessage_time - send_time) + 'ms');

        parseStart = new Date();
        socket.type = $.parseJSON(e.data)['type'];
        socket.grid = $.parseJSON(e.data)['grid'];
        socket.command = $.parseJSON(e.data)['command'];
        parseEnd = new Date();

        console.log('Parsed Time: ' + (parseEnd - parseStart) + 'ms');
        //draw();

        if (socket.type == 'prediction') {

            // Load predictions from socket into simulation
            simulation.addPredictions(socket.grid);

            // Indicate that client is done retrieving predictions
            simulation.isPredicting = false;

        }

        if (socket.command == 'drawGrid') {

            // Retrieve next prediction
            simulation.grid = simulation.predictions.pop()

            // Draw grid
            simulation.drawGrid();
        }

     }

     return socket;


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


    $('#button-step').click(function() {

        simulation.stepSimulation();

    })

    $('#button-run').click(function() {

        $this = $(this)

        // If button is not switched on
        if (!$this.hasClass('switched-on')) {

            // Style button
            $this.addClass('switched-on');
            $this.text('Stop');

            // Run simulation
            simulation.runSimulation();

        }
        // If button is switched on
        else {

            // Style button
            $this.removeClass('switched-on');
            $this.text('Run');

            // Stop simulation
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

        console.log('clearing')

        message_data = { 'command': 'clear' };
        socket.send(JSON.stringify(message_data));


    })
}



//*************************************************//
// One method of sending all data to server through WS
//*************************************************//
var sendData = function(message_data) {

    send_time = new Date();
    this.socket.send(JSON.stringify(message_data));

}


//*************************************************//
// Initiates simulation
//*************************************************//
 var startSimulation = function() {

    // Initialize simulation

    // Bind console buttons
    this.bindConsoleButtons();

    // Create WebSocket
    this.socket = createWebSocket();

    // Create canvas background
    this.background = this.drawRowsCols();

    this.drawRowsCols();

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

    var coord = this.getRowCol(x, y);

    // Send pattern to websocket
    message_data =  {
        row: coord.row,
        col: coord.col,
        pattern: pattern,
        command: 'addPattern',
    }

    this.sendData(message_data);

}


//*************************************************//
// Update canvas one generation
//*************************************************//
var stepSimulation = function() {

    var step_start = new Date()

    // If simulation is running, do nothing
    //if (this.isRunning) { return; }

    // If grid is empty, do nothing
    if (this.population == 0) { return; }

    // If no predictions are available, wait for new ones to come from server
    else if (this.predictions.length == 0) {
        this.awaitPredictions();
        return;
    }

    // Retrieve next prediction
    this.grid = this.predictions.pop()

    // Draw grid
    this.drawGrid();

    // If prediction buffer is too low, add predictions
    if (this.predictions.length <= this.predictionRefresh && !this.isPredicting) {

        // Indicate that client is retrieving more predicitons
        this.isPredicting = true

        // Send data to websocket
        message_data =  {
            'serverCommand': 'predict',
            'clientCommand': ''
        }

        this.sendData(message_data);

    }

    console.log('Prediction Buffer Size: ' + this.predictions.length);
    var step_end = new Date()
    console.log('Step Time: ' + (step_end - step_start) + 'ms');

}

//*************************************************//
// Load wait screen, disable button, while awaiting predictions
//*************************************************//
var awaitPredictions = function() {

    // Flag to indicate if simulation is paused
    var simPaused = false;

    // If simulation is running, stop
    if (this.isRunning) {
        this.stopSimulation();
        simPaused = true;
    }

    // Show loading screen
    $('.loader-wrapper').css('display', 'flex');

    // Store 'this' (to pass to setInterval)
    var that = this;

    // Create a setInterval that run while predictions are being generated
    var waitInterval = setInterval(function() {

        if (that.predictions.length > 0) {

            // Deactivate setInterval
            clearInterval(waitInterval);

            // Hide loader
            $('.loader-wrapper').css('display', 'none');

            // If simulation is paused, resume simulation
            if (simPaused) {
                that.runSimulation();
            }
        }

    }, 20);




}

//*************************************************//
// Update simulation at regular intervals
//*************************************************//
var runSimulation = function() {

    this.isRunning = true;

    that = this;

    var interval = this.simIntervals[this.simSpeed];
    this.simInterval = setInterval(function() {

        return that.stepSimulation();

    }, 20);

}


//*************************************************//
// Stop/pause simulation
//*************************************************//
var stopSimulation = function() {

    clearInterval(this.simInterval)
    this.isRunning = false;
}


//*************************************************//
// Make cells highlighted by user active
//*************************************************//
var activateCells = function(newCells) {


    message_data =  {
        newCells: newCells,
        command: 'activateCells',
    }

    this.sendData(message_data);

}


//*************************************************//
// Draw rows and col of simulation on canavas
//*************************************************//
var drawRowsCols = function() {

    var rc_canvas = document.createElement('canvas');
    rc_canvas.width = this.ctxWidth;
    rc_canvas.height = this.ctxHeight;
    var rc_ctx = rc_canvas.getContext('2d');


    rc_ctx.strokeStyle = '#ddd';
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

    this.ctx.drawImage(this.background, 0, 0);

    var drawEnd = performance.now();
    console.log('Draw Time: ' + (drawEnd - drawStart) + 'ms')
}


//*************************************************//
// Clear simulation canvas
//*************************************************//
var clearCanvas = function() {

    self.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}




//*************************************************//
// Clear simulation canvas
//*************************************************//
var clearGrid = function() {


    //self.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);


    message_data =  {
        newCells: newCells,
        command: 'clearGrid',
    }

    this.sendData(message_data);
}


//*************************************************//
// Toggle dead/alive status of individual cell on canvas
//*************************************************//
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