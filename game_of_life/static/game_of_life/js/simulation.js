//*************************************************//
// Class to implement the Simulation
//*************************************************//
var Simulation = function(dashboard) {

    // Simulacra object
    var obj = {};


    // Canvas variables
    var canvas = document.getElementById("grid");
    obj.ctx = canvas.getContext("2d");
    obj.ctx.fillStyle = "#06D6A0";
    obj.ctx.strokeStyle = "#0af1b5";
    
    
    // Some arbitrary constant that determines the approx. length of cell side  
    obj.cellSide = 10;
    
    
    // Drawing methods
    obj.drawRowsCols = drawRowsCols;
    obj.drawGrid = drawGrid;
    obj.eraseCanvas = eraseCanvas;
    
    
    // Simulation controls
    obj.initSimulation = initSimulation;
    obj.stepSimulation = stepSimulation;
    obj.runSimulation = runSimulation;
    obj.stopSimulation = stopSimulation;
    obj.clearSimulation = clearSimulation;
    obj.simSpeed = 'slow';
    obj.simSpeeds = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    };
    
    
    // Variables that govern relationship between client and server
    obj.isRunning = false;
    obj.isPredicting = false;
    obj.isFrozen = false;
    obj.isPaused = false;
    obj.isAltering = false;
    obj.atLimit = false;
    obj.outgoingNum = 0;
    obj.incomingNum = 0; 
    obj.genTimeline  = [];
    obj.maxYearReached = 0;
    
    
    // Details about the current generation
    obj.pop = 0;
    obj.year = 0;
    obj.cells = [];
    

    // Secondary methods for disabling controls
    obj.freezeButtons = freezeButtons;
    obj.startBuffering = startBuffering;
    obj.endBuffering = endBuffering;
    
    
    // Methods for user interaction
    obj.randomizeSimulation = randomizeSimulation;
    obj.addPattern = addPattern;
    obj.activateCells = activateCells;
    obj.chooseGeneration = chooseGeneration;
    
    
    // Secondary helper methods for user interaction
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;

    
    // Methods and variables related to predictions
    obj.predictions = [];
    obj.predictionRefresh = 30;
    obj.processNextPrediction = processNextPrediction;
    obj.addPredictions = addPredictions;


    // WebSockets
    obj.createWebSocket = createWebSocket;
    obj.sendData = sendData;
    
    
    // Dashboard
    obj.dashboard = dashboard;
    obj.updateConsole = updateConsole;
    

    // Resizing window
    obj.updateGridDimensions = updateGridDimensions;
    obj.updateDropBoxes = updateDropBoxes;
    obj.onResize = onResize;

    // Implementing various event handlers
    obj.bindEventListeners = bindEventListeners;

    return obj;
};


/*--------------------------------------------------------*/
// Simulation Controls
/*--------------------------------------------------------*/

//*************************************************//
// Initiates simulation
//*************************************************//
 var initSimulation = function() {

    // Freeze console while loading
    this.startBuffering();

    // Bind Event listeners
    this.bindEventListeners(this);

    // Create grid dimensions
    this.updateGridDimensions();

    // Create canvas background
    this.background = this.drawRowsCols();

    // Update dimensions of pattern drag and drop boxes
    this.updateDropBoxes();

    // Create WebSocket
    this.socket = createWebSocket(this);

    // Select initial server speed
    $('#button-' + this.simSpeed).addClass('switched-on');

};


//*************************************************//
// Update canvas one generation
//*************************************************//
var stepSimulation = function() {

    // Track step start
    // var step_start = performance.now();

    // If simulation is paused, do nothing
    if (this.isPaused) { return; }

    // If grid is empty, do nothing
    if (this.pop == 0) { return; }

    // If simulation is at it's limit, do nothing
    if (this.atLimit) { return; }

    // If no predictions are available, wait for new ones to come from server
    else if (this.predictions.length == 0) {
        this.isPaused = true;
        this.startBuffering();
        return;
    }

    // Process the next prediction
    this.processNextPrediction();

    // If prediction buffer is too low, add predictions
    if (this.predictions.length <= this.predictionRefresh && !this.isPredicting && !this.atLimit) {

        // Indicate that client is retrieving more predictions (adding to current queue)
        // This prevent queue from querying server over and over        
        this.isPredicting = true;

        // Get last year currently in prediction queue
        var lastYear = this.predictions[0].year;

        // Send data to WebSocket
        var message_data =  {
            'serverCommand': 'getPredictions',
            'clientCommand': '',
            year: lastYear + 1
        };

        this.sendData(message_data);

    }

//    console.log('Prediction Buffer Size: ' + this.predictions.length);
//    var step_end = performance.now();
//    console.log('Step Time: ' + (step_end - step_start) + 'ms');
};


//*************************************************//
// Update simulation at regular intervals
//*************************************************//
var runSimulation = function() {

    // Indicate that simulation is running
    this.isRunning = true;

    var that = this;
    
    // Start interval
    var interval = this.simSpeeds[this.simSpeed];
    this.simInterval = setInterval(function() {
        return that.stepSimulation();
    }, interval);

};


//*************************************************//
// Stop/pause simulation
//*************************************************//
var stopSimulation = function() {

    // Clear simulation interval
    clearInterval(this.simInterval);
    
    // Indicate that simulation is not running
    this.isRunning = false;
    
};


//*************************************************//
// Clear simulation canvas
//*************************************************//
var clearSimulation = function() {

    // If simulation is running, stop
    if (this.isRunning) {
        this.stopSimulation();
    }

    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = 0;
    
    // Reset year
    this.year = 0;

    // Freeze console
    this.startBuffering();

    // Query server
    var message_data =  {
        'serverCommand': 'clear',
        'clientCommand': 'drawGrid'
    };

    this.sendData(message_data);

};


/*--------------------------------------------------------*/
// Prediction buffer operations
/*--------------------------------------------------------*/


//*************************************************//
// Enqueue predictions to prediction queue
//*************************************************//
var addPredictions = function(predictions) {

    for (var i = 0; i < predictions.length; i++) {
        this.predictions.unshift(predictions[i]);
    }

};


//*************************************************//
// Extract and process next prediction off queue
//*************************************************//
var processNextPrediction = function() {

    // Retrieve next prediction
    var generation = this.predictions.pop();
    this.cells = generation['cells'];
    this.pop = generation['pop'];
    this.year = generation['year'];

    // Draw grid
    this.drawGrid();

    // Update statistics
    this.updateConsole();

    // If you encounter the limit year
    if (this.year == this.limit.year) {

        if (this.limit.param == 'year') {
            $(".limit-year").show();
            $(".limit-population").hide();
        }
        else if (this.limit.param == 'population') {
            $(".limit-year").hide();
            $(".limit-population").show();
        }

        // Stop running of simulation
        if (this.isRunning) {
            this.stopSimulation();
        }

        // Style run button
        $('#button-run').removeClass('switched-on');
        $('#button-run').addClass('console-freezable');
        $('#button-run').text('Run');

        // Reveal limit message
        $('.console-limit').fadeIn();
        $('.console-limit').css('display', 'flex');

        // Freeze console buttons
        $('.console-freezable').addClass('frozen');

        // Indicate that sim has reached limit
        this.atLimit = true;
        return;

    }
    // Otherwise, if it isn't limit year, but was before
    else if (this.atLimit) {

        // Hide limit message
        $('.console-limit').fadeOut();

        // Unfreeze buttons
        $('.console-freezable').removeClass('frozen');

        this.atLimit = false;
        return;
    }

    this.atLimit = false;
    return;

};


/*--------------------------------------------------------*/
// User interaction methods
/*--------------------------------------------------------*/


//*************************************************//
// Make cells highlighted by user active
//*************************************************//
var activateCells = function(newCells) {
    
    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = this.year;

    // Freeze console
    this.startBuffering();

    // Send data to server
    var message_data =  {
        serverCommand: 'activateCells',
        clientCommand: 'drawGrid',
        newCells: newCells,
        year: this.year
    }

    this.sendData(message_data);

};


//*************************************************//
// Add chosen pattern to simulation canvas
//*************************************************//
var addPattern = function(x, y, pattern) {;

    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = this.year;

    // Await predictions
    this.startBuffering();

    // Compute coordinates of placed pattern
    var coord = this.getRowCol(x, y);

    // Send pattern to websocket
    var message_data =  {
        row: coord.row,
        col: coord.col,
        pattern: pattern,
        year: this.year,
        serverCommand: 'addPattern',
        clientCommand: 'drawGrid'
    };

    this.sendData(message_data);

};


//*************************************************//
// Randomize simulation canvas
//*************************************************//
var randomizeSimulation = function() {

    // If simulation is running, stop
    if (this.isRunning) {
        this.isPaused = true;
    }

    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = this.year;
    
    // Freeze console
    this.startBuffering();

    // Send data to server
    var message_data =  {
        'serverCommand': 'randomize',
        'clientCommand': 'drawGrid',
        'gridRows': this.gridRows,
        'gridCols': this.gridCols,
        'year': this.year
    };

    this.sendData(message_data);
};

//*************************************************//
// Change generation
//*************************************************//
var chooseGeneration = function(year) {

    // Empty out predictions
    this.predictions = [];

    // Freeze console
    this.startBuffering();


    var message_data =  {
        serverCommand: 'getPredictions',
        clientCommand: 'drawGrid',
        year: year
    };

    this.sendData(message_data);

};


/*--------------------------------------------------------*/
// Drawing Methods
/*--------------------------------------------------------*/


//*************************************************//
// Define dimensions of canvas/context
//*************************************************//
var updateGridDimensions = function() {

    // Start ctx path
    this.ctx.beginPath();
    
    // Store instance variable as local variable
    var ctx = this.ctx;

    ctx.canvas.width = this.ctxWidth = $("canvas#grid").width();
    ctx.canvas.height = this.ctxHeight = $("canvas#grid").height();

    // Context colors are reset when width/height is changed
    this.ctx.fillStyle = "#06D6A0";
    this.ctx.strokeStyle = "#0af1b5";

    // Compute number of cols, rows and canvas area
    this.gridCols = Math.floor(ctx.canvas.width / this.cellSide);
    this.gridRows = Math.floor(ctx.canvas.height / this.cellSide);
    this.gridArea = this.gridCols * this.gridRows;

    // Compute size of cells
    this.cellWidth = ctx.canvas.width / this.gridCols;
    this.cellHeight = ctx.canvas.height / this.gridRows;

    // Display grid dimensions
    $("#grid-rows").text(this.gridRows.toLocaleString());
    $("#grid-cols").text(this.gridCols.toLocaleString());
    $("#grid-area").text(this.gridArea.toLocaleString());

};


//*************************************************//
// Draw grid (active cells, rows and cols) of simulation
// on canvas
//*************************************************//
var drawGrid = function() {

    // var drawStart = performance.now();
    
    // Clear canvas
    this.eraseCanvas();

    // Reset count of visible population
    this.visiblePop = 0;

    // Loop through living cells
    let cells = this.cells;

    for (let cell of cells) {
        
        var row = cell[0];
        var col = cell[1];

        // If row,col is within bounds of canvas
        if (row >= 0 && row < this.gridRows && col >=0 && col < this.gridCols) {
            
            // Add colored rectable
            this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
            
            // Increment count of visible population
            this.visiblePop += 1;

        }

    }

    // Draw background over canvas
    this.ctx.drawImage(this.background, 0, 0);

//    var drawEnd = performance.now();
//    console.log('Draw Time: ' + (drawEnd - drawStart) + 'ms')
};


//*************************************************//
// Draw rows and col of simulation on canavas
//*************************************************//
var drawRowsCols = function() {
    
    // Create new canvas and context object for rows/columns
    var rc_canvas = document.createElement('canvas');
    rc_canvas.width = this.ctxWidth;
    rc_canvas.height = this.ctxHeight;
    var rc_ctx = rc_canvas.getContext('2d');


    // Define color and width of rows/columns
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

    // Do actual drawing
    rc_ctx.stroke();
    
    // Return prepared canvas object
    return rc_canvas;
    
};


//*************************************************//
// Toggle dead/alive status of individual cell on canvas
//*************************************************//
var toggleCell = function(row, col, turnOn) {

    if (turnOn) {
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
        this.ctx.strokeRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    } else {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    }
    
    return;

};


//*************************************************//
// Clear simulation canvas
//*************************************************//
var eraseCanvas = function() {
    
    // Create canvas
    this.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}



//*************************************************//
// Computes row and col with x, y coordinates
// (from top, left origin)
//*************************************************//
var getRowCol = function(x, y) {

    var row = Math.floor(y / this.cellWidth);
    var col = Math.floor(x / this.cellHeight);

    return { row: row, col: col };

};


//*************************************************//
// Update console dashboard
//*************************************************//
var updateConsole = function() {

    // Update numbers on dashboard 
    $('#console-pop').text(this.pop);
    $('#console-gen').text(this.year);
    $('#console-pop-visible').text("(" + this.visiblePop + ")");

    // Update max year reached so far
    this.maxYearReached = Math.max(this.year, this.maxYearReached);

    // Redraw dashboard (chart and timeline)
    this.dashboard.drawDashboard(this);

};


/*--------------------------------------------------------*/
// Disable/enable console
/*--------------------------------------------------------*/


//*************************************************//
// Load wait screen, disables button, while awaiting predictions
//*************************************************//
var startBuffering = function() {

    // Indicate that simulation is buffering
    this.isBuffering = true;

    // Show buffering screen
    $('.buffer-wrapper').css('display', 'flex');

    // Freeze controls
    this.freezeButtons(true);

    // Create a setInterval that run while predictions are being generated
    this.freezeInterval = setInterval(function() { return; }, 20);

};

//*************************************************//
// Hide wait screen, reenable buttons and clear waiting interval
//*************************************************//
var endBuffering = function() {

    // Deactivate setInterval
    clearInterval(this.freezeInterval);

    // Hide buffer screen
    $('.buffer-wrapper').css('display', 'none');

    // If simiulation is not at limit, unfreeze
    if (!this.atLimit) {
        this.freezeButtons(false);
    }
    
    // Indicate that simulation is not frozen
    this.isBuffering = false;

};

//*************************************************//
// Disable/enable console buttons
//*************************************************//
var freezeButtons = function(bool) {
    
    if (bool) {
        // Freeze buttons
        $('.console-freezable').addClass('frozen');    
    } else {
        // Unfreeze buttons
        $('.console-freezable').removeClass('frozen');
    }
    
};


/*--------------------------------------------------------*/
// Resize methods
/*--------------------------------------------------------*/


//*************************************************//
// Redraw canvas and dashboard when window resizes
//*************************************************//
var onResize = function() {

    var that = this;

    $(window).on("resize", function() {

        // Update grid dimensions
        that.updateGridDimensions();

        // Recreate canvas background
        that.background = that.drawRowsCols();

        // Redraw grid
        that.drawGrid();

        // Update Console
        that.updateConsole();

        // Update pattern drop boxes
        that.updateDropBoxes();

        // If windows size is medium+, show dashboard
        if (window.outerWidth > 992) {
            $('#collapseDashboard').collapse('show');
        }
        
    });
};


//*************************************************//
// Change size of drop boxes
//*************************************************//
var updateDropBoxes = function() {
    
    var that = this;

    // Loop through drop boxes
    let drop_boxes = Array.from(document.getElementsByClassName('drop-box'));

    for (let box of drop_boxes) {

        var patternRows = $(box).attr('data-pattern-rows');
        var patternCols = $(box).attr('data-pattern-cols');

        $(box).height(patternRows * that.cellHeight);
        $(box).width(patternCols * that.cellWidth);

    }

};

/*--------------------------------------------------------*/
// WebSocket
/*--------------------------------------------------------*/


//*************************************************//
// Create WebSocket
//*************************************************//
var createWebSocket = function(sim) {

    var wsProtocol = 'ws://';
    
    // If website is delivered over secure protocol, upgrade websocket protocol
    if (window.location.protocol == "https:") {
        wsProtocol = "wss://";
    }
    
    // Instantiate websocket
    var socket = new WebSocket(wsProtocol + window.location.host + '/game-of-life' + window.location.pathname);

    // Add close event listener
    socket.addEventListener('close', function(e) {
        
        // Trigger restart modal
        socketRestartModal(e, sim);
        
    });
    
    // Add error event listener
    socket.addEventListener('error', function(e) {  
        
        // Trigger restart modal
        socketRestartModal(e, sim);
        
    });

    //Add message event listener
    socket.addEventListener('message', function(e) {
        socketMessage(e, sim); 
    });

    // Send first message when WebSocket finishes opening
    socket.addEventListener('open', function(event){

        // Send data to websocket
        var message_data =  {
            'cols':  sim.gridCols,
            'rows': sim.gridRows,
            'serverCommand': 'initConway',
            'clientCommand': 'drawGrid'
        };

        sim.sendData(message_data);

    });

     return socket;
};

//*************************************************//
// Display restart modal, first part of restart connection
// process. Exiting the modal will trigger creation of new websocket 
// (event listener for exit handled elsewhere)
//*************************************************//
var socketRestartModal = function(e, sim) {
    
    // Show restart modal
    $("#modal-simulation-error").modal('show');
    $("#modal-simulation-error").css('display', 'flex');
    
    // If simulation is running, stop
    if (sim.isRunning) {
        sim.stopSimulation();
    }
    
    // Empty predictions buffer
    sim.predictions = [];

    // Reset maxYear
    sim.maxYearReached = 0;
    
    // Reset year
    sim.year = 0;

    // Reset outgoing number
    sim.outgoingNum = 0;
    
    // Style run button as off
    $('#button-run').removeClass('switched-on');
    $('#button-run').text('Run');
   
};

//*************************************************//
// Handle incoming message from server
//*************************************************//
var socketMessage = function(e, sim) {
   
    // Time total websocket time
    // var received_time = new Date();
    // console.log('WebSocket Time: ' + (received_time - send_time) + 'ms');

    // Parse message from server
    var message = $.parseJSON(e.data);
    
    // Identify message coming from server
    sim.incomingNum = message.order;

    if (sim.incomingNum < sim.outgoingNum) {
        console.info("Message received behind message sent for.")
        return;
    }
    
    if (sim.incomingNum > sim.outgoingNum) {
        console.info("Something very strange is going on");
    }
    
    // Update simulaton variables
    sim.genTimeline = message.genTimeline;
    sim.limit = message.limit;

    // Load prediction queue
    if (message.content == 'predictions') {

        // Load predictions from socket into simulation
        sim.addPredictions(message.predictions);

        // Indicate that client is done retrieving predictions
        sim.isPredicting = false;

    }

    // Process next prediction
    if (message.clientCommand == 'drawGrid') {
        sim.processNextPrediction();
    }

    // If simulation is buffering, end buffering process
    if (sim.isBuffering) {
        sim.endBuffering();
    }

    // If simultion is not being altered (user interaction), don't unpause
    if (!sim.isAltering) {
        sim.isPaused = false;
    }
    
};

//*************************************************//
// One method for sending all data to server through WS
//*************************************************//
var sendData = function(message_data) {

    // send_time = performance.now();

    // Execute send if socket is ready
    if (this.socket.readyState == WebSocket.OPEN) {
        this.outgoingNum += 1;
        this.socket.send(JSON.stringify(message_data));
    }

};