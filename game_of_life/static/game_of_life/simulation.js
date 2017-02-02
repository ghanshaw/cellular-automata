//*************************************************//
// Class to implement the Simulation
//*************************************************//
var Simulation = function() {

    var obj = {};

    /* Some arbitrary constant that determines the approx. length of cell side */
    /* Should change based on the size of the screen */
    var canvas = document.getElementById("grid");

    obj.ctx = canvas.getContext("2d");

    obj.ctx.fillStyle = "#06D6A0";
    obj.ctx.strokeStyle = "#0af1b5";
    obj.cellSide = 10;

    obj.simSpeed = 'slow';
    obj.predictions = [];

    obj.isRunning = false;
    obj.isPredicting = false;
    obj.isFrozen = false;
    

    obj.updateDropBoxes = updateDropBoxes;

    obj.pop = 0;
    obj.year = 0;
    obj.cells = [];

    obj.dashboard = dashboard;

    // Max year reached in buffer so far
    obj.maxYearReached = 0;

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

    obj.outgoingNum = 0;
    obj.incomingNum = 0;

    obj.randomizeSimulation = randomizeSimulation;


    obj.addPattern = addPattern;
    obj.getRowCol = getRowCol;
    obj.toggleCell = toggleCell;
    obj.activateCells = activateCells;

    obj.isPaused = false;
    
    // Prevents unpausing when user is interactive with console and
    // predictions come from server
    obj.isAltering = false;
    obj.atLimit = false;


    obj.bindConsoleButtons = bindConsoleButtons;

    obj.addPredictions = addPredictions;
    obj.createWebSocket = createWebSocket;
    obj.sendData = sendData;
    obj.freezeButtons = freezeButtons;
    obj.startBuffering = startBuffering;
    obj.endBuffering = endBuffering;
    obj.updateConsole = updateConsole;

    obj.chooseGeneration = chooseGeneration;

    //obj.maxYear = 0;
    obj.updateGridDimensions = updateGridDimensions;
    obj.onResize = onResize;


    // --- D3 methods and variables
    obj.initDashboard = initDashboard;
    obj.genTimeline  = [];


    obj.processNextPrediction = processNextPrediction;


    obj.predictionRefresh = 15;

    obj.simSpeeds = {
        'slow': 200,
        'medium': 100,
        'fast': 50
    };

    return obj;
    
    //obj.clearFuture = clearFuture;
    //obj.recordHistory = recordHistory;
    //obj.eraseHistory = eraseHistory;


};

//var eraseHistory = function() {
//
//    simulation.genTimeline = [];
//
//    //simulation.maxYear = 0;
//}

var restartConnection  = function() {

    // Freeze simulation

    this.socket = createWebSocket();

    // Proceed when WebSocket finishes opening
    this.socket.addEventListener('open', function(event){

        // Send data to websocket
        var message_data =  {
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
var createWebSocket = function(sim) {

    var socket = new WebSocket("ws://" + window.location.host + '/game-of-life' + window.location.pathname);

    socket.addEventListener('open', function() {
        
        
    });

    socket.addEventListener('close', function(e) {
        
        // Trigger restart modal
        socketRestartModal(e, sim);
    });
    
    
    socket.addEventListener('error', function(e) {
        
        // Trigger restart modal
        socketRestartModal(e, sim);
    });


    socket.addEventListener('message', function(e) {
        socketMessage(e, sim); 
    });


    // Proceed when WebSocket finishes opening
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

}

var socketRestartModal = function(e, sim) {
    
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

    // Reset outgoing number
    sim.outgoingNum = 0;
    
    // Style run button
    $('#button-run').removeClass('switched-on');
    $('#button-run').text('Run');

   
};

var socketMessage = function(e, sim) {
   
    // Time total websocket time
    var received_time = new Date();
    console.log('WebSocket Time: ' + (received_time - send_time) + 'ms');


    var parseStart = new Date();
    var message = $.parseJSON(e.data);
    var parseEnd = new Date();

    console.log('Parsed Time: ' + (parseEnd - parseStart) + 'ms');
    //draw();

    sim.incomingNum = message.order;
    console.log('Incoming Num: ' + sim.incomingNum)

    if (sim.incomingNum < sim.outgoingNum) {
        alert('Out of order!');
        return;
    }

    sim.genTimeline = message.genTimeline;
    sim.limit = message.limit;

    if (message.content == 'predictions') {

        // Load predictions from socket into simulation
        sim.addPredictions(message.predictions);

        // Indicate that client is done retrieving predictions
        sim.isPredicting = false;

    }

    if (message.clientCommand == 'drawGrid') {

        sim.processNextPrediction();

    }

    if (sim.isBuffering) {
        sim.endBuffering();
    }

    if (!sim.isAltering) {
        sim.isPaused = false;
    }
    
}




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

        // Indicate that is reached
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

    }



    this.atLimit = false;

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

    var sim = this;

     // Bind buttons on simulation itself
     $("#button-canvas-clear").on('click', function() {

        // Clear simulation
        sim.clearSimulation();

     })

    // Bind closing of modal to new websocket creation
    $("#modal-simulation-error").on("hidden.bs.modal", function() {
        
        console.log('hide me!');
        
        // Create new web socket
        sim.socket = sim.createWebSocket(sim);
        
    });
     


     /*
     Create draggabilly buttons for each console button
     Use draggabilly to exploit 'is-pointing' class,
     ensure consistent behavior on mobile and desktop and
     avoid use of ':active' psuedo-class
     */


    // Create draggabilly step button
    var $btnStep = $('#button-step').draggabilly({});
    $btnStep.draggabilly('disable');

    $btnStep.on('staticClick', function() {

        sim.stepSimulation();

    });

    // Create draggabilly run button
    var $btnRun = $('#button-run').draggabilly({});
    $btnRun.draggabilly('disable');

    $btnRun.on('staticClick', function() {

        var $this = $(this);

        // If button is not switched on
        if (!$this.hasClass('switched-on') && simulation.pop > 0) {

            // Style button
            $this.addClass('switched-on');
            $this.text('Stop');

            // Add console-freezable class
            $this.removeClass('console-freezable');

            // Run simulation
            sim.runSimulation();

        }
        // If button is switched on
        else {

            // Style button
            $this.removeClass('switched-on');
            $this.text('Run');

            // Add console-freezable class
            $this.addClass('console-freezable');

            sim.stopSimulation();

            // Stop simulation
            // If simulation is running
            if (simulation.isRunning) {
                alert("Simulation isn't running");
            }

        }

    })


    // Create draggabilly random button
    var $btnRandom = $('#button-random').draggabilly({});
    $btnRandom.draggabilly('disable');

    $btnRandom.on('staticClick', function() {

         sim.randomizeSimulation()

    })

    // Create draggabilly clear button
    var $btnClear = $('#button-clear').draggabilly({});
    $btnClear.draggabilly('disable');

    $btnClear.on('staticClick', function() {

        // Style run button
        $('#button-run').removeClass('switched-on');
        $('#button-run').addClass('console-freezable');
        $('#button-run').text('Run');


        // Clear simulation
        sim.clearSimulation();


    })


    // Create draggabilly speed buttons
    var speedButtons = document.getElementsByClassName('btn-speed');
    var $btnSpeedArray = [];

    for (var i = 0; i < speedButtons.length; i++) {

        // Initialize a speed button
        var $btnSpeed = $('.btn-speed').draggabilly({});
        $btnSpeed.draggabilly('disable');

        // Add static click behavior
        $btnSpeed.on('staticClick', function(event) {

            var $this = $(this)
            console.log($this)

            // If button isn't switched on
            if (!$this.hasClass('switched-on')) {

                // Style buttons
                $('.btn-speed').removeClass('switched-on');
                $this.addClass('switched-on');

                // Update the simulation speed
                sim.simSpeed = this.id.split('-')[1];

                // If simulation is running
                if (sim.isRunning) {

                    // Restart simulation
                    sim.stopSimulation();
                    sim.runSimulation();
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

    // Bind console buttons
    this.bindConsoleButtons();

    // Create grid dimensions
    this.updateGridDimensions();

    // Create canvas background
    this.background = this.drawRowsCols();

    // Update dimensions of pattern drag and drop boxes
    this.updateDropBoxes();

    // Add resize event listener
    this.onResize();

    // Create WebSocket
    this.socket = createWebSocket(this);

    // Select initial server speed
    $('#button-' + this.simSpeed).addClass('switched-on');

    var sim = this;

    // Bind dashboard reveal to resizing
    $('#collapseDashboard').on('shown.bs.collapse', function () {
        sim.updateConsole();
    });
//    
//    //Initialize modal
//    $('#modal-simulation-error').modal({
//        backdrop: true,
//        keyboard: true,
//        show: false
//    })

};


//*************************************************//
// Update canvas one generation
//*************************************************//
var stepSimulation = function() {

    var step_start = new Date();

    // If simulation is running, do nothing
    //if (this.isRunning) { return; }

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
        //this.runSimulation();
        return;
    }

//    // Retrieve next generation from prediction
//    var generation = this.predictions.pop()
//    this.cells = generation['cells'];
//    this.pop = generation['pop'];
//    this.year = generation['year'];
//
//    // Draw grid
//    this.drawGrid();
//
//    // Record history
//    //this.recordHistory();
//
//    // Update statistics
//    this.updateConsole()

    // Process the next prediction
    this.processNextPrediction();

    // If prediction buffer is too low, add predictions
    if (this.predictions.length <= this.predictionRefresh && !this.isPredicting && !this.atLimit) {

        console.log('Get predictions!');

        // Indicate that client is retrieving more predictions (adding to current queue)
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

    console.log('Prediction Buffer Size: ' + this.predictions.length);
    var step_end = new Date();
    console.log('Step Time: ' + (step_end - step_start) + 'ms');

};


//*************************************************//
// Update simulation at regular intervals
//*************************************************//
var runSimulation = function() {

    this.isRunning = true;

    var that = this;

    var interval = this.simSpeeds[this.simSpeed];
    this.simInterval = setInterval(function() {

        return that.stepSimulation();

    }, interval);

};


//*************************************************//
// Stop/pause simulation
//*************************************************//
var stopSimulation = function() {

    clearInterval(this.simInterval);
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

    // Freeze console
    this.startBuffering();


    var message_data =  {
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

    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = this.year;
    
    // Freeze console
    this.startBuffering();

    var message_data =  {
        'serverCommand': 'randomize',
        'clientCommand': 'drawGrid',
        'gridRows': this.gridRows,
        'gridCols': this.gridCols,
        'year': this.year
    };

    this.sendData(message_data);
};

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
    // Visibile cells on canvas
    this.visiblePop = 0;

    let cells = this.cells;

    for (let cell of cells) {

        var row = cell[0];
        var col = cell[1];

        if (row >= 0 && row < this.gridRows && col >=0 && col < this.gridCols) {

            this.ctx.fillRect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
            this.visiblePop += 1;

        }

    };

    this.ctx.drawImage(this.background, 0, 0);



    var drawEnd = performance.now();
    console.log('Draw Time: ' + (drawEnd - drawStart) + 'ms')
}


//*************************************************//
// Clear simulation canvas
//*************************************************//
var eraseCanvas = function() {

    this.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);

}


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

    var message_data =  {
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

    $('#console-pop-visible').text("(" + this.visiblePop + ")");

    // Update max year reached so far
    this.maxYearReached = Math.max(this.year, this.maxYearReached);

    //
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

    var row = Math.floor(y / this.cellWidth);
    var col = Math.floor(x / this.cellHeight);

    return { row: row, col: col };

}


//*************************************************//
// Add chosen pattern to simulation canvas
//*************************************************//
var addPattern = function(x, y, pattern) {

    console.log('Add pattern!');

    // Empty predictions buffer
    this.predictions = [];

    // Reset maxYear
    this.maxYearReached = this.year;

    // Await predictions
    this.startBuffering()

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
    }

    this.sendData(message_data);

}


//*************************************************//
// Load wait screen, disable button, while awaiting predictions
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

}


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

}


var freezeButtons = function(bool) {
    
    if (bool) {
        // Freeze buttons
        $('.console-freezable').addClass('frozen');    
    } else {
        // Unfreeze buttons
        $('.console-freezable').removeClass('frozen');
    }
}



var chooseGeneration = function(year) {

    // Empty out predictions
    this.predictions = [];

    // Freeze console
    this.startBuffering();


    var message_data =  {
        serverCommand: 'getPredictions',
        clientCommand: 'drawGrid',
        year: year
    }

    this.sendData(message_data);

}

var updateDropBoxes = function() {

    let drop_boxes = Array.from(document.getElementsByClassName('drop-box'));

    var that = this;

    for (let box of drop_boxes) {

        var patternRows = $(box).attr('data-pattern-rows');
        var patternCols = $(box).attr('data-pattern-cols');


        $(box).height(patternRows * that.cellHeight);
        $(box).width(patternCols * that.cellWidth);

    }

}


var onResize = function() {

    var that = this;

    $(window).on("resize", function() {

        var canvasWidth = $("canvas#grid").width();
        var canvasHeight = $("canvas#grid").height()

      //  if (canvasWidth != that.ctxWidth || canvasHeight != that.ctxHeight) {

        console.log($('#grid').width());

        // Update grid dimensions
        that.updateGridDimensions();

        // Redraw background
        that.ctx.background = that.drawRowsCols();

        // Create canvas background
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



    })
}

var updateGridDimensions = function() {

    this.ctx.beginPath();
    
    var ctx = this.ctx;

    ctx.canvas.width = this.ctxWidth = $("canvas#grid").width();
    ctx.canvas.height = this.ctxHeight = $("canvas#grid").height();

    // Context colors are reset when width/height is changed
    this.ctx.fillStyle = "#06D6A0";
    this.ctx.strokeStyle = "#0af1b5";

    this.gridCols = Math.floor(ctx.canvas.width / this.cellSide);
    this.gridRows = Math.floor(ctx.canvas.height / this.cellSide);
    this.gridArea = this.gridCols * this.gridRows;

    this.cellWidth = ctx.canvas.width / this.gridCols;
    this.cellHeight = ctx.canvas.height / this.gridRows;

    // Display grid dimensions
    $("#grid-rows").text(this.gridRows.toLocaleString());
    $("#grid-cols").text(this.gridCols.toLocaleString());
    $("#grid-area").text(this.gridArea.toLocaleString());

}


//
//
//var clearFuture = function() {
//
//    // Clear predictions
//    this.predictions = [];
//
//    // Reset maxYear
//    this.maxYearReached = this.year;
//
//};

