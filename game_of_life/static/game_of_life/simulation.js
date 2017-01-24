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
    //ctx.fillStyle = "#ef476f";

    // Orange-Yellow
    //ctx.fillStyle = "#FFD166";

    // Carribean Green
    ctx.fillStyle = "#06D6A0";

    // Slategrey
    //ctx.fillStyle = "slategrey";

    ctx.strokeStyle = '#ddd';


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

    obj.isOn = false;
    obj.isPredicting = false;
    obj.isFrozen = false;

    obj.pop = 0;
    obj.year = 0;



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



    obj.addPattern = addPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;
    obj.activateCells = activateCells;



    obj.bindConsoleButtons = bindConsoleButtons;

    obj.addPredictions = addPredictions;
    obj.createWebSocket = createWebSocket;
    obj.sendData = sendData
    obj.awaitPredictions = awaitPredictions;
    obj.updateStats = updateStats;

    obj.predictionRefresh = 15;

    obj.simSpeeds = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    }

    return obj;

}

restartConnection  = function() {

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

        if (message.content == 'predictions') {

            // Load predictions from socket into simulation
            simulation.addPredictions(message.predictions);

            // Indicate that client is done retrieving predictions
            simulation.isPredicting = false;

        }

        else if (message.content == 'generation') {

            // Load single generation into predictions queue
            simulation.addPredictions([message.generation])

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
            simulation.updateStats()
        }

        if (message.clientCommand == 'eraseCanvas') {

            // Apply empty generation
            simulation.grid = message.generation['grid'];
            simulation.pop = message.generation['pop'];
            simulation.year = message.generation['year'];


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

            // Run simulation
            simulation.runSimulation();

        }
        // If button is switched on
        else {

            // Style button
            $this.removeClass('switched-on');
            $this.text('Run');

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

        message_data = { 'command': 'random' };
        socket.send(JSON.stringify(message_data));

    })

    // Create draggabilly clear button
    $btnClear = $('#button-clear').draggabilly({});
    $btnClear.draggabilly('disable');

    $btnClear.on('staticClick', function() {

        // Style button
        $('#button-run').removeClass('switched-on');
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
    this.socket.send(JSON.stringify(message_data));

}


/*--------------------------------------------------------*/
// Simulation Controls
/*--------------------------------------------------------*/


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

    // If grid is empty, do nothing
    if (this.pop == 0) { return; }

    // If no predictions are available, wait for new ones to come from server
    else if (this.predictions.length == 0) {
        this.awaitPredictions();
        return;
    }

    // Retrieve next generation from prediction
    var generation = this.predictions.pop()
    this.grid = generation['grid'];
    this.pop = generation['pop'];
    this.year = generation['year'];

    // Draw grid
    this.drawGrid();

    // Update statistics
    simulation.updateStats()

    // If prediction buffer is too low, add predictions
    if (this.predictions.length <= this.predictionRefresh && !this.isPredicting) {

        console.log('Get predictions!');

        // Indicate that client is retrieving more predictions
        this.isPredicting = true

        // Send data to WebSocket
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

    message_data =  {
        'serverCommand': 'clear',
        'clientCommand': 'drawGrid',
    }

    this.sendData(message_data);
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

    // Empty out predictions
    this.predictions = [];

    // Await predictions
    this.awaitPredictions();

    message_data =  {
        serverCommand: 'activateCells',
        clientCommand: 'drawGrid',
        newCells: newCells,
        year: this.year
    }

    this.sendData(message_data);

}




var updateStats = function() {

    $('#console-pop').text(this.pop);
    $('#console-gen').text(this.year);

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

    // Empty out predictions
    this.predictions = [];

    // Await predictions
    this.awaitPredictions()

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
var awaitPredictions = function() {

    // Flag to indicate if simulation is paused
    //var simPaused = false;


    // If simulation is on (and isn't frozen), freeze it
    if (this.isRunning) {
        this.stopSimulation();
        this.isFrozen = true;
    }

    // Show loading screen
    $('.loader-wrapper').css('display', 'flex');

    // Stop console functionality


    // Store 'this' (to pass to setInterval)
    var that = this;

    // Create a setInterval that run while predictions are being generated
    this.simInterval = setInterval(function() {

        if (that.predictions.length > 0) {

            // Deactivate setInterval
            clearInterval(this.simInterval);

            // Hide loader
            $('.loader-wrapper').css('display', 'none');

            // If simulation is frozen, unfreeze and run
            if (that.isFrozen) {
                that.isFrozen = false;
                that.runSimulation();
            }
        }

    }, 20);




}