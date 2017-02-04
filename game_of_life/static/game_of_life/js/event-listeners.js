//*************************************************//
// Class to track edges of a DOM element
//*************************************************//
var Edges = function(element, sim) {
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
    };

    // inBounds method evaluates whether element a is within the bounds of element b
    // ex: a.inBound(edgesB) returns true if a is within b
    edges.inBounds = function(outer) {

        return top > outer.top && left > outer.left && right <= (outer.right + sim.cellWidth) && bottom <= (outer.bottom + sim.cellHeight);

    };

    return edges;
};


//*************************************************//
// Bind various event listeners
//*************************************************//
var bindEventListeners = function(sim) {
    
    // Bind noraml (jquery/javascript/bootstrap) events
    normalEvents(sim);
    
    // Create buttons as dragabillly objects
    draggabillyButtons(sim);
    
    // Implements pointer movements on canvas
    draggabillyCanvas(sim);
    
    // Implement drag/drop with patterns
    draggabillyPatterns(sim);
    
};


//*************************************************//
// Bind normal event listeners
//*************************************************//
function normalEvents(sim) {
    
    // Bind window resize to redrawing canvas and dashboard
    sim.onResize();
    
    // Bind dashboard uncollapse to dashboard redrawing
    $('#collapseDashboard').on('shown.bs.collapse', function () {
        sim.updateConsole();
    });
    
     // Bind clear button on canvas (when simulation reaches limit) to simulation clear
     $("#button-canvas-clear").on('click', function() {

        // Clear simulation
        sim.clearSimulation();

     });

    // Bind closing of simulation error modal to new websocket creation
    $("#modal-simulation-error").on("hidden.bs.modal", function() {        
        
        // Create new web socket
        sim.socket = sim.createWebSocket(sim);
        
    });
     
    // Activate tooltip
    $('#simulation-info').tooltip();

}


//*************************************************//
// Create all draggabilly objects
// Draggabilly plugin provide mobile/desktop drag/drop
// functionality and touch/click functionality
//*************************************************//
function draggabillyButtons(sim) {
    
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
        if (!$this.hasClass('switched-on') && sim.pop > 0) {

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

            // Stop simulation    
            sim.stopSimulation();

        }
    });

    // Create draggabilly random button
    var $btnRandom = $('#button-random').draggabilly({});
    $btnRandom.draggabilly('disable');

    $btnRandom.on('staticClick', function() {
         sim.randomizeSimulation();
    });

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

    });

    // Create draggabilly speed buttons
    var speedButtons = document.getElementsByClassName('btn-speed');
    var $btnSpeedArray = [];

    for (var i = 0; i < speedButtons.length; i++) {

        // Initialize a speed button
        var $btnSpeed = $('.btn-speed').draggabilly({});
        $btnSpeed.draggabilly('disable');

        // Add static click behavior
        $btnSpeed.on('staticClick', function(event) {

            var $this = $(this);

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

};


//*************************************************//
// Turn canvas into draggabilly object
// Enables cell highlighting
//*************************************************//
function draggabillyCanvas(sim) {
    
    var $grid = $("#grid");

    var $draggieGrid = $('#grid').draggabilly({});
    $draggieGrid.draggabilly('disable');

    // Track cells highlighted by users and prevent duplicates
    $draggieGrid.newCells = [];
    $draggieGrid.setCells = new Set();

    // When user presses down on canvas
    $draggieGrid.on('pointerDown', function(event, pointer) {

        // Pause and indicate that simulation is being altered if running
        // Prevents additional changes from being made 
        if (sim.isRunning) {
            sim.isPaused = true;
            sim.isAltering = true;
        }

        // Clear set of new cells
        $draggieGrid.setCells.clear();
        $draggieGrid.newCells = [];

        // Acquire edges of canvas
        var gridEdges = Edges($grid, sim);

        // Acquire x and y coordinates of pointer relative to grid
        var gridX = pointer.pageX - gridEdges.left;
        var gridY = pointer.pageY - gridEdges.top;

        // Compute corresponding row and column
        var rowCol = sim.getRowCol(gridX, gridY);

        // Confirm that cell is within bounds of grid
        var inBounds = rowCol.row >= 0 && rowCol.row < sim.gridRows && rowCol.col >= 0 && rowCol.col < sim.gridCols;
        if (!inBounds) { return; }

        // Create cell id (unique identifier of cell)
        var cellId = rowCol.row + '.' + rowCol.col;

        // Add cell to array of new cells if not present
        if (!$draggieGrid.setCells.has(cellId)) {
            var cell = [rowCol.row, rowCol.col];
            $draggieGrid.newCells.push(cell);
            $draggieGrid.setCells.add(cellId);
        }

        // Draw cell visually
        sim.toggleCell(rowCol.row, rowCol.col, true);

    });

    // When user moves pointer
    $draggieGrid.on('pointerMove', function(event, pointer) {

        // Acquire edges of canvas
        var gridEdges = Edges($grid, sim);
        
        // Acquire x and y coordinates of pointer relative to grid
        var gridX = pointer.pageX - gridEdges.left;
        var gridY = pointer.pageY - gridEdges.top;

        // Compute corresponding row and column
        var rowCol = sim.getRowCol(gridX, gridY);

        // Confirm that cell is within bounds of grid
        var inBounds = rowCol.row >= 0 && rowCol.row < sim.gridRows && rowCol.col >= 0 && rowCol.col < sim.gridCols;
        if (!inBounds) { return; }

        // Create cell id (unique identifier of cell)
        var cellId = rowCol.row + '.' + rowCol.col;

        // Add cell to array of new cells if not present
        if (!$draggieGrid.setCells.has(cellId)) {
            var cell = [rowCol.row, rowCol.col];
            $draggieGrid.newCells.push(cell);
            $draggieGrid.setCells.add(cellId);
        }

        // Draw cell visually
        sim.toggleCell(rowCol.row, rowCol.col, true);

    });

    // When user raises pointer 
    $draggieGrid.on('pointerUp', function(event, pointer) {

        // Indicate that simulation is not being altered
        sim.isAltering = false;
        
        // Send cell update to server
        sim.activateCells($draggieGrid.newCells);

    });

};


//*************************************************//
// Implement plugin for simulation patterns
// Enables drag and drop of patterns
//*************************************************//
function draggabillyPatterns(sim) {

    var $grid = $("#grid");

    // Select all patterns
    var patterns = document.getElementsByClassName('pattern-wrapper');
    var $draggiePatterns = [];

    // Iterate through patterns, attaching events
    for (var i = 0; i < patterns.length; i++) {
        
        // Create draggabilly object for each pattern
        var $draggiePattern = $(patterns[i]).draggabilly({});

        // When user drags pattern
        $draggiePattern.on('dragStart', function(event, pointer) {

            // Scroll to grid area (neccessary for mobile)
            var $gridOffsetTop = $grid.offset().top;
            $('body').animate({
                scrollTop: $gridOffsetTop - 50
            }, 500);

        });

        // When user moves pattern
        $draggiePattern.on('dragMove', function(event, pointer){
            
            // Select pattern, pattern wrapper, and drop box (box
            // that appears before dropping, represents pattern's true size)
            var $pattern = $(event.currentTarget).find('img');
            var $dropBox = $(event.currentTarget).find('.drop-box');
            var $patternWrapper = $(event.currentTarget);
            
            // Aquire edges of grid and drop box edges
            var gridEdges = Edges($grid, sim);
            var dropBoxEdges = Edges($dropBox, sim);
            
            // If pattern is within bounds of grid
            if (dropBoxEdges.inBounds(gridEdges)) {

                // If simulation is running and not paused, pause it
                // Indicate that simulation is being altered
                if (sim.isRunning && !sim.isPaused) {
                    sim.isPaused = true;
                    sim.isAltering = true;
                }

                // Add special styling
                $pattern.addClass('in-bounds');
                $patternWrapper.addClass('in-bounds');

            } 
            // If simulation is not within bounds
            else {

                // If simulation is running and is paused, unpause it
                if (sim.isRunning && sim.isPaused) {
                    sim.isPaused = false;
                    sim.isAltering = false;
                }

                // Remove special styling
                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }
            
        });

        // If user drops pattern
        $draggiePattern.on('dragEnd', function(event, pointer) {
            
            // Select pattern, pattern wrapper, and drop box
            var $pattern = $(event.currentTarget).find('img');
            var $dropBox = $(event.currentTarget).find('.drop-box');
            var $patternWrapper = $(event.currentTarget);

            // Aquire name of pattern
            var patternName = event.target.id.split('-')[1];

            // Aquire edges of grid and drop box edges
            var gridEdges = Edges($grid, sim);
            var dropBoxEdges = Edges($dropBox, sim);
            
            // Indicate that simulation is not altered
            sim.isAltering = false;

            // If you drop in bounds and simulation isn't frozen or at limit
            if (dropBoxEdges.inBounds(gridEdges) && !sim.isBuffering && !sim.atLimit) {

                // Remove styling, fade element and return it
                $patternWrapper.fadeOut(500, function() {
                    $pattern.removeClass('in-bounds');
                    $patternWrapper.removeClass('in-bounds').css({ 'left': 0, 'top': 0 }).show();

                });

                // Compute row and column of pattern in grid
                var y = gridEdges.top - dropBoxEdges.top;
                var x = gridEdges.left - dropBoxEdges.left;
                x = Math.abs(x);
                y = Math.abs(y);
                
                // Send pattern and drop location to server
                sim.addPattern(x, y, patternName);

            }
            // If pan ends and pattern is not within bounds
            // or simulation is buffering or at limit
            else {

                // Put pattern back
                $patternWrapper.animate({
                    left: 0,
                    top: 0
                }, 500);

                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        });

        // Add objects to array
        $draggiePatterns.push($draggiePattern);

    }
}